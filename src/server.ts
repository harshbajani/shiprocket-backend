import app from "./app";

const PORT = parseInt(process.env.PORT as string, 10) || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Public access: http://<your-elastic-ip>:${PORT}`);
});
