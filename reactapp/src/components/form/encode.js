import React from 'react';
import './form.css';

const Form = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    
    const fileInput = event.target.elements.fileUpload;
    const selectedFile = fileInput.files[0];
    const btnName = event.nativeEvent.submitter.name
    if (!selectedFile) {
      console.log("No file selected.");
      return;
    }

    const textInput = event.target.elements.textInput.value;
    var data = new FormData();
    data.append("base_file", selectedFile);
    data.append("text", textInput);

    fetch("http://localhost:5000/encode/", {
      method: "POST",
      body: data
    }).then(async function (response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = "encoded_image.png"
      // Convert response to blob
      const blob = await response.blob();
      var data = new FormData();
      const file = new File([blob], "save_it.png")
      data.append("file", file);
      if(btnName==="up"){
        fetch("http://inventory-managment.ap-south-1.elasticbeanstalk.com/api/s3", {
          method: "POST",
          body: data
        }).then(async function (res) {
            const resp = await res.json();
            console.log(resp);
           const res_msg = "Image Link (copy and save it): "+ resp.url
           alert(res_msg);
        }).catch(function (error) {
          alert("File is too large to save it in cloud. Download the file instead")
          console.error("Fetch Error:", error);
        });
      }else{
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.click();
        // Clean up
        URL.revokeObjectURL(blobUrl);
      }
    }).catch(function (error) {
      console.error("Fetch Error:", error);
      alert("Oops! " + error.message);
    });
  };

  const downloadRandomImage = () =>{
    fetch("https://api.unsplash.com//photos/random?client_id=SlqNcGhtw0VYyGIRmTG2XJhmOAKUp833TYW6Kx3l", {
      method: "GET"
    }).then(async function (response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const filename = "sample_image.jpeg"
      const jsonRes = await response.json()
      fetch(jsonRes.urls.full)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          a.click();
          // Clean up
          URL.revokeObjectURL(blobUrl);
        });
    }).catch(function (error) {
      console.error("Fetch Error:", error);
      alert("Oops! " + error.message);
    });
  }

  return (
    <div className="form-container">
      <h3 className='title'>Encode data</h3>
      <div className="form-group download-image">
          <button onClick={downloadRandomImage}>Download Sample Image</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fileUpload">Upload File:</label>
          <input type="file" id="fileUpload" name="fileUpload" accept=".jpg,jpeg,.png" />
        </div>
        <div className="form-group">
          <label htmlFor="textInput">Text Input:</label>
          <textarea id="textInput" name="textInput" rows="3" cols="50"></textarea>
        </div>
        <div className="form-group">
          <button name="down" className="btn-down" type="submit">Encode and download</button>
          <button name="up" className="btn-up" type="submit">Encode and save it to cloud</button>
        </div>
      </form>
    </div>
  );
};

export default Form;
