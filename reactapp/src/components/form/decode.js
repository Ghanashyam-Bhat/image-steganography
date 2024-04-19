import React from 'react';
import './form.css';

const Form = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const fileInput = event.target.elements.fileUpload;
    const selectedFile = fileInput.files[0];
    
    if (!selectedFile) {
      console.log("No file selected.");
      return;
    }

    var data = new FormData();
    data.append("encoded_file", selectedFile);

    fetch("http://localhost:5000/decode/", {
      method: "POST",
      body: data
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(function (jsonData) {
      alert("Decoded text is: " + jsonData.data);
    }).catch(function (error) {
      console.error("Fetch Error:", error);
      alert("Oops! " + error.message);
    });
  };

  return (
    <div className="form-container">
      <h3 className='title'>Decode data</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fileUpload">Upload File:</label>
          <input type="file" id="fileUpload" name="fileUpload" accept=".png" />
        </div>
        <div className="form-group">
          <button type="submit">Decode the image</button>
        </div>
      </form>
    </div>
  );
};

export default Form;
