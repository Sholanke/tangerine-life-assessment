const getElemFromDom = (str) => {
  return document.querySelector(str);
};
const getAllElemFromDom = (str) => {
  return document.querySelectorAll(str);
};

const file_input_dom_element = getElemFromDom("input[type=file]");
const table_area = getElemFromDom(".table-area");
const saveBtn = getElemFromDom(".sv-btn");
const endpoint = "https://httpbin.org/anything";
const dropArea = getElemFromDom(".drop-area");
const file_name_node = getElemFromDom("h1");
let currentFile;
let file_errors_array = [];
const accepted_headers = [
  "Fullname",
  "Phone Number",
  "Address",
  "State",
  "LGA",
  "Date of Birth",
  "Salary",
  "Gender",
  "Call Allowance",
  "Transport Allowance",
];

file_input_dom_element.addEventListener("change", handleFile, false);

// drag nad drop functionality code
dropArea.addEventListener("dragenter", handlerFunction, false);
dropArea.addEventListener("dragleave", handlerFunction, false);
dropArea.addEventListener("dragover", handlerFunction, false);
dropArea.addEventListener("drop", handlerFunction, false);

dropArea.addEventListener("drop", handleFile, false);

dropArea.addEventListener("dragenter", highlight, false);
dropArea.addEventListener("dragover", highlight, false);

dropArea.addEventListener("dragleave", unHighlight, false);
dropArea.addEventListener("drop", unHighlight, false);

function handlerFunction() {
  event.preventDefault();
}

function highlight() {
  event.currentTarget.classList.add("highlight");
}

function unHighlight() {
  event.currentTarget.classList.remove("highlight");
}

//handle display of file
function handleFile(e) {
  const files = e.target.files || e.dataTransfer.files,
    f = files[0];
  file_name_node.innerHTML = `File Name : ${f.name}`;

  let reader = new FileReader();
  reader.onload = function (e) {
    let data = new Uint8Array(e.target.result);
    // defining workbook
    let workbook = XLSX.read(data, { type: "array" });
    // getting name of first sheet in wookbook sheets
    const first_sheet = workbook.SheetNames[0];
    //getting work sheet
    const workSheet = workbook.Sheets[first_sheet];
    const work_sheet_to_json = XLSX.utils.sheet_to_json(workSheet);
    // console.log(work_sheet_to_json);

    //check if each acceptable header exists
    accepted_headers.forEach((column) => {
      if (column in work_sheet_to_json[0]) {
        // console.log(`Found column ${column} in excel sheet header`);
      } else {
        file_errors_array.push(
          `Couldn't find header "${column}" in excel sheet headers`
        );
      }
    });

    //check if headers in sheet are acceptable
    Object.keys(work_sheet_to_json[0]).forEach((column) => {
      accepted_headers.includes(column)
        ? true
        : file_errors_array.push(`Found extra header "${column}" in headers`);
    });

    //if any, output error, else display file
    file_errors_array.length > 0
      ? file_errors_array.map((error) => {
          console.error("PROBLEM WITH EXCEL FILE >>>", error);
          $.notify(error, "error-alert");
        })
      : (() => {
          console.log("No Errors Found With Excel Sheet");
          $.notify("Valid Excel Sheet", "success-alert");

          //show save button
          saveBtn.classList.remove("hide");

          //clear table area for new file
          table_area.innerHTML = "";

          //add headers to table in dom
          let headersInnerHtml = ``;
          accepted_headers.map((header) => {
            headersInnerHtml += `<div class="column">${header}</div>`;
          });
          table_area.innerHTML += `<div class="row flex headers">${headersInnerHtml}</div>`;

          //display excel sheet in dom
          work_sheet_to_json.map((row) => {
            let rowInnerHTML = ``;
            Object.keys(row).map((column) => {
              // console.log(row[column]);
              rowInnerHTML += `<div class="column" data-key=${column}>${row[column]}</div>`;
            });
            table_area.innerHTML += `<div class="row flex">${rowInnerHTML}</div>`;
          });

          //make files global
          currentFile = f;
        })();
  };
  reader.readAsArrayBuffer(f);
}

//handle actual file upload to server
function uploadFile(file, endpoint) {
  //loader
  saveBtn.classList.add("loading");

  const options = {
    method: "POST",
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    body: currentFile,
  };
  // console.log(options);
  fetch(endpoint, options)
    .then((response) => {
      response.status.toString()[0] == 2
        ? $.notify("File submitted successfully", "success-alert")
        : $.notify("We couldn't upload that file", "error-alert");
      return response.json();
    })
    .then((obj) => {
      saveBtn.classList.remove("loading");
    })
    .catch((error) => {
      $.notify("Something went wrong", "error-alert");
      saveBtn.classList.remove("loading");
    });
}
saveBtn.addEventListener("click", () => uploadFile(currentFile, endpoint));
