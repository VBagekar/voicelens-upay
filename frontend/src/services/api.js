/**
 * VoiceLens API Service
 * Handles all HTTP calls to the Flask backend.
 */

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,  // 30s for BERT inference
    headers: { "Content-Type": "application/json" },
});

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** Health check */
export const checkHealth = () =>
    api.get("/health");

/** List available models */
export const getModels = () =>
    api.get("/models");

/**
 * Analyze a single text
 * @param {string} text
 * @param {string} model - "bert" | "vader" | "textblob" | "all"
 */
export const analyzeText = (text, model = "bert") =>
    api.post("/analyze-text", { text, model });

/**
 * Analyze multiple texts
 * @param {string[]} texts
 * @param {string} model
 */
export const analyzeBatch = (texts, model = "bert") =>
    api.post("/analyze-batch", { texts, model });

/**
 * Analyze uploaded file
 * @param {File} file - CSV or Excel
 * @param {string} model
 * @param {string} column - optional column name hint
 */
export const analyzeFile = (file, model = "bert", column = "") => {
    const form = new FormData();
    form.append("file", file);
    form.append("model", model);
    if (column) form.append("column", column);

    return axios.post(`${BASE_URL}/analyze-file`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,  // 60s for large files
    });
};

export default api;