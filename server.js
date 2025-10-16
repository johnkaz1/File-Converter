const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch'); // node-fetch@2
const FormData = require('form-data');
const path = require('path');

const app = express();
const upload = multer();

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// 🔑 Replace with your real CloudConvert API key
const CLOUDCONVERT_API_KEY = "";

// === WORD → PDF ===
app.post('/api/convert-docx-to-pdf', upload.single('docx'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded.");

    const jobResp = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDCONVERT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tasks: {
          "import-my-file": { operation: "import/upload" },
          "convert-my-file": {
            operation: "convert",
            input: "import-my-file",
            input_format: "docx",
            output_format: "pdf"
          },
          "export-my-file": { operation: "export/url", input: "convert-my-file" }
        }
      })
    });

    const jobData = await jobResp.json();
    if (!jobData.data) throw new Error("Invalid CloudConvert job creation: " + JSON.stringify(jobData));

    const importTask = jobData.data.tasks.find(t => t.name === "import-my-file");
    const uploadUrl = importTask.result.form.url;
    const uploadParams = importTask.result.form.parameters;

    const formData = new FormData();
    for (const [k, v] of Object.entries(uploadParams)) formData.append(k, v);
    formData.append("file", req.file.buffer, req.file.originalname);

    const uploadResp = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!uploadResp.ok) throw new Error("Upload failed: " + uploadResp.statusText);

    console.log("✅ Word file uploaded. Waiting for conversion...");

    const jobId = jobData.data.id;
    let finishedJob = null;

    for (let i = 0; i < 60; i++) {
      const statusResp = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` }
      });
      const statusJson = await statusResp.json();
      if (statusJson.data.status === "finished") {
        finishedJob = statusJson;
        break;
      }
      if (statusJson.data.status === "error") throw new Error("CloudConvert job failed.");
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!finishedJob) throw new Error("Job timeout or not finished.");

    const exportTask = finishedJob.data.tasks.find(
      t => t.operation === "export/url" && t.status === "finished"
    );
    const fileUrl = exportTask.result.files[0].url;

    const pdfResp = await fetch(fileUrl);
    const pdfBuffer = await pdfResp.buffer();

    res.setHeader("Content-Type", "application/pdf");
    const baseName = req.file.originalname.replace(/\.docx?$/i, "");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Conversion error:", err);
    res.status(500).json({ error: err.message });
  }
});

// === PDF → WORD ===
app.post('/api/convert-pdf-to-docx', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded.");

    const jobResp = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDCONVERT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tasks: {
          "import-my-file": { operation: "import/upload" },
          "convert-my-file": {
            operation: "convert",
            input: "import-my-file",
            input_format: "pdf",
            output_format: "docx"
          },
          "export-my-file": { operation: "export/url", input: "convert-my-file" }
        }
      })
    });

    const jobData = await jobResp.json();
    if (!jobData.data) throw new Error("Invalid CloudConvert job creation: " + JSON.stringify(jobData));

    const importTask = jobData.data.tasks.find(t => t.name === "import-my-file");
    const uploadUrl = importTask.result.form.url;
    const uploadParams = importTask.result.form.parameters;

    const formData = new FormData();
    for (const [k, v] of Object.entries(uploadParams)) formData.append(k, v);
    formData.append("file", req.file.buffer, req.file.originalname);

    const uploadResp = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!uploadResp.ok) throw new Error("Upload failed: " + uploadResp.statusText);

    console.log("✅ PDF uploaded. Waiting for conversion...");

    const jobId = jobData.data.id;
    let finishedJob = null;

    for (let i = 0; i < 60; i++) {
      const statusResp = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` }
      });
      const statusJson = await statusResp.json();
      if (statusJson.data.status === "finished") {
        finishedJob = statusJson;
        break;
      }
      if (statusJson.data.status === "error") throw new Error("CloudConvert job failed.");
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!finishedJob) throw new Error("Job timeout or not finished.");

    const exportTask = finishedJob.data.tasks.find(
      t => t.operation === "export/url" && t.status === "finished"
    );
    const fileUrl = exportTask.result.files[0].url;

    const docxResp = await fetch(fileUrl);
    const docxBuffer = await docxResp.buffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const baseName = req.file.originalname.replace(/\.pdf$/i, "");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.docx"`);
    res.send(docxBuffer);
  } catch (err) {
    console.error("❌ Conversion error (PDF→Word):", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});

