export function notFoundHandler(req, res) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found" } });
}
export function errorHandler(err, req, res, next) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message } });
}
