import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';

const app = express();

app.use(
  '/static',
  createProxyMiddleware({
    target: `${process.env.BACKENDURL}/static`, // 実際の画像があるサーバーURL
    changeOrigin: true,
  })
);

console.log(`/staticのプロキシ先: ${process.env.BACKENDURL}`);

// 2. SPAのビルド成果物を公開
app.use(express.static('build/client'));

// 3. それ以外は全部 index.html へ (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.resolve('build/client/index.html'));
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
