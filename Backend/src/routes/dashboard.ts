import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Serve a simple dashboard HTML page
 */
router.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAG Microservice Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .endpoint {
            margin-bottom: 40px;
            border: 2px solid #f0f0f0;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .endpoint:hover {
            border-color: #667eea;
            background: #f9f9ff;
        }
        .endpoint h2 {
            font-size: 18px;
            color: #667eea;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .method.post {
            background: #667eea;
        }
        .method.get {
            background: #48bb78;
        }
        .description {
            color: #666;
            margin-bottom: 15px;
            font-size: 14px;
        }
        .input-group {
            margin-bottom: 12px;
        }
        label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
        }
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .button-group {
            display: flex;
            gap: 10px;
        }
        button {
            flex: 1;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        .response {
            margin-top: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 4px;
            border-left: 4px solid #667eea;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            max-height: 300px;
            overflow-y: auto;
            display: none;
        }
        .response.active {
            display: block;
        }
        .response.error {
            border-left-color: #f56565;
            background: #fff5f5;
        }
        .response.success {
            border-left-color: #48bb78;
            background: #f0fff4;
        }
        .status {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .loading {
            display: none;
            text-align: center;
            color: #667eea;
        }
        .loading.active {
            display: block;
        }
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f0f0f0;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .info {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 12px;
            border-radius: 4px;
            font-size: 13px;
            color: #1e40af;
            margin-bottom: 20px;
        }
        .info code {
            background: white;
            padding: 2px 4px;
            border-radius: 2px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 RAG Microservice</h1>
            <p>Retrieval-Augmented Generation with local embeddings and an OpenAI-compatible LLM API</p>
        </div>
        
        <div class="content">
            <div class="info">
                ℹ️ Make sure you've added your <code>OPENAI_API_KEY</code> to the <code>.env</code> file before using POST endpoints.
            </div>

            <!-- Health Check -->
            <div class="endpoint">
                <h2><span class="method get">GET</span> /health</h2>
                <div class="description">Check if the service is running</div>
                <button class="btn-primary" onclick="callHealth()">Test Health Check</button>
                <div class="loading" id="health-loading"><span class="spinner"></span>Loading...</div>
                <div class="response" id="health-response"></div>
            </div>

            <!-- Ingest -->
            <div class="endpoint">
                <h2><span class="method post">POST</span> /ingest</h2>
                <div class="description">Load FAQ data from data/beem_faqs.json and ingest into vector store (idempotent)</div>
                <button class="btn-primary" onclick="callIngest()">Ingest FAQs</button>
                <div class="loading" id="ingest-loading"><span class="spinner"></span>Loading...</div>
                <div class="response" id="ingest-response"></div>
            </div>

            <!-- Query -->
            <div class="endpoint">
                <h2><span class="method post">POST</span> /query</h2>
                <div class="description">Query the RAG system and get answers based on FAQ context</div>
                <div class="input-group">
                    <label>Question:</label>
                    <textarea id="query-question" placeholder="e.g., How do I create an account?">How do I create an account?</textarea>
                </div>
                <div class="input-group">
                    <label>Top K Results:</label>
                    <input type="number" id="query-topk" value="3" min="1" max="20">
                </div>
                <button class="btn-primary" onclick="callQuery()">Query</button>
                <div class="loading" id="query-loading"><span class="spinner"></span>Loading...</div>
                <div class="response" id="query-response"></div>
            </div>
        </div>
    </div>

    <script>
        async function callHealth() {
            const responseDiv = document.getElementById('health-response');
            const loadingDiv = document.getElementById('health-loading');
            
            loadingDiv.classList.add('active');
            responseDiv.classList.remove('active');
            
            try {
                const res = await fetch('/health');
                const data = await res.json();
                
                responseDiv.innerHTML = '<div class="status success">✅ Success (' + res.status + ')</div>' + JSON.stringify(data, null, 2);
                responseDiv.classList.add('active', 'success');
            } catch (error) {
                responseDiv.innerHTML = '<div class="status error">❌ Error</div>' + (error instanceof Error ? error.message : 'Unknown error');
                responseDiv.classList.add('active', 'error');
            } finally {
                loadingDiv.classList.remove('active');
            }
        }

        async function callIngest() {
            const responseDiv = document.getElementById('ingest-response');
            const loadingDiv = document.getElementById('ingest-loading');
            
            loadingDiv.classList.add('active');
            responseDiv.classList.remove('active');
            
            try {
                const res = await fetch('/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                
                if (res.ok) {
                    responseDiv.innerHTML = '<div class="status success">✅ Success (' + res.status + ')</div>' + JSON.stringify(data, null, 2);
                    responseDiv.classList.add('active', 'success');
                } else {
                    responseDiv.innerHTML = '<div class="status error">❌ Error (' + res.status + ')</div>' + JSON.stringify(data, null, 2);
                    responseDiv.classList.add('active', 'error');
                }
            } catch (error) {
                responseDiv.innerHTML = '<div class="status error">❌ Error</div>' + (error instanceof Error ? error.message : 'Unknown error');
                responseDiv.classList.add('active', 'error');
            } finally {
                loadingDiv.classList.remove('active');
            }
        }

        async function callQuery() {
            const responseDiv = document.getElementById('query-response');
            const loadingDiv = document.getElementById('query-loading');
            const question = document.getElementById('query-question').value;
            const topK = parseInt(document.getElementById('query-topk').value);
            
            if (!question.trim()) {
                responseDiv.innerHTML = '<div class="status error">❌ Error</div>Question cannot be empty';
                responseDiv.classList.add('active', 'error');
                return;
            }
            
            loadingDiv.classList.add('active');
            responseDiv.classList.remove('active');
            
            try {
                const res = await fetch('/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, top_k: topK })
                });
                const data = await res.json();
                
                if (res.ok) {
                    responseDiv.innerHTML = '<div class="status success">✅ Success (' + res.status + ' - ' + data.latency_ms + 'ms)</div>' + JSON.stringify(data, null, 2);
                    responseDiv.classList.add('active', 'success');
                } else {
                    responseDiv.innerHTML = '<div class="status error">❌ Error (' + res.status + ')</div>' + JSON.stringify(data, null, 2);
                    responseDiv.classList.add('active', 'error');
                }
            } catch (error) {
                responseDiv.innerHTML = '<div class="status error">❌ Error</div>' + (error instanceof Error ? error.message : 'Unknown error');
                responseDiv.classList.add('active', 'error');
            } finally {
                loadingDiv.classList.remove('active');
            }
        }

        // Auto-test health on page load
        window.addEventListener('load', function() {
            setTimeout(callHealth, 500);
        });
    </script>
</body>
</html>
  `;
  
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export { router as dashboardRouter };
