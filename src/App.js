import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { getAllNodesAPI, disconnectedNodeAPI, uploadFileAPI, serverUrl } from './serverApi/server'
import "./App.css";


export default function Dashboard() {
  const [nodes, setNodes] = useState([]);
  const [file, setFile] = useState(null);
  const [activity, setActivity] = useState([]);
  const wsRef = useRef(null);

  const addActivity = (text, type = "info") => {
    setActivity((prev) => [
      { time: new Date().toLocaleString(), text, type },
      ...prev.slice(0, 79),
    ]);
  };

  // ---------- WebSocket ----------
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = serverUrl.replace(/^http/, proto) + "/ws/dashboard/";
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => addActivity("Realtime channel connected");
    ws.onclose = () => addActivity("Realtime channel disconnected", "warn");
    ws.onerror = (e) => console.warn("WebSocket error", e);
    
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.event === "upload:status") {
          addActivity(
            `Upload ${data.status} — ${data.nodeId} ${data.detail || ""}`
          );
          setNodes((prev) =>
            prev.map((n) =>
              n.node_id === data.nodeId
                ? {
                    ...n,
                    last_upload_status:
                      data.status + (data.detail ? ` (${data.detail})` : ""),
                  }
                : n
            )
          );
        } else if (data.event === "node:update") {
          addActivity(`Node ${data.nodeId} is now ${data.status}`);
          refreshNodes();
        } else {
        addActivity(JSON.stringify(data));
        }
      } catch (err) {
        console.warn("WS parse error", err);
      }
    };
    return () => ws.close();
  }, []);

  const refreshNodes = async () => {
    try {
      const responseData = await getAllNodesAPI();
      setNodes(responseData.data);
    } catch (err) {
      addActivity("Failed to fetch nodes: " + err.message, "error");
    }
  };

  useEffect(() => {
    refreshNodes();
  }, []);

  const handleDisconnect = async (nodeId) => {
    try {
      await disconnectedNodeAPI(nodeId)
      addActivity(`Requested disconnect for ${nodeId}`, "warn");
      refreshNodes();
    } catch (err) {
      addActivity("Disconnect failed: " + err.message, "error");
    }
  };

  const handleInspect = (nodeId) => {
    addActivity(`Inspect requested for ${nodeId}`, "info");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please choose a file first");
    const UploadFileFormData = new FormData();
    UploadFileFormData.append("file", file);
    try {
      const uploadFileAPIResponse = await uploadFileAPI(UploadFileFormData);
      console.log("Upload response:", uploadFileAPIResponse.data);
      addActivity(`Upload started: ${uploadFileAPIResponse.data.filename} (uploadId ${uploadFileAPIResponse.data.uploadId})`);
      setFile(null);
    } catch (err) {
      addActivity("Upload failed: " + err.message, "error");
    }
  };


  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-section">
          <div className="logo">CMS</div>
          <div>
            <h1 className="title">Central Management — Node Dashboard</h1>
            <p className="subtitle">
              Manage and distribute files to registered nodes — real-time status & logs
            </p>
          </div>
        </div>

        <div className="header-actions">
          <form onSubmit={handleUpload} className="upload-form">
            <label className="file-label">
              Choose file
              <input
                type="file"
                className="file-input"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            <div className="file-name">{file ? file.name : "No file selected"}</div>
            <button className="btn btn-primary">Upload to All Nodes</button>
          </form>

          <button onClick={refreshNodes} className="btn btn-outline">
            Refresh
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="main-layout">
        {/* Nodes Table */}
        <section className="card">
          <h3 className="section-title">Nodes</h3>
          <table className="nodes-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>Host</th>
                <th>Status</th>
                <th>Last Upload</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.node_id}>
                  <td>{n.node_id}</td>
                  <td>{n.ip}:{n.port}</td>
                  <td>
                    <span
                      className={`status-badge ${n.status === "connected" ? "connected" : "disconnected"}`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td>{n.last_upload_status}</td>
                  <td>
                    <button onClick={() => handleDisconnect(n.node_id)} className="btn btn-outline small">
                      Disconnect
                    </button>
                    <button onClick={() => handleInspect(n.node_id)} className="btn btn-primary small">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Activity Panel */}
        <aside className="card">
          <h3 className="section-title">Activity</h3>
          <p className="subtitle">Realtime events from nodes and uploads</p>
          <div className="activity-list">
            {activity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-meta">
                  {a.time} • {a.type}
                </div>
                <div className="activity-text">{a.text}</div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="footer">
        © Node Management · Live updates via WebSocket
      </footer>
    </div>
  );
}

