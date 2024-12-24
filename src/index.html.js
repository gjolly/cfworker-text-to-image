const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nes.css/2.3.0/css/nes.min.css" integrity="sha512-LVdzC5GAu4VEEGcarpj2jruxNUONmGEMdcc6AL7a7nSHR7QAmyLfx3SUPCSSFsNZPuZLQInrUSkqWYHpyOYeRg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Image Generator</title>
    <style>
        body {
            font-family: "Press Start 2P";
            display: flex;
            flex-wrap: wrap;
            margin: 10px
            height: 100vh;
        }
        .block {
            flex: 1 1 300px;
        }
        .block:first-child {
            max-width: 500px; /* Set the maximum width for the first block */
        }
        #button {
            margin-top: 20px;
        }
        #result {
            margin: 10px;
        }
        #params {
            margin: 10px;
        }
        img {
            margin-top: 20px;
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
            display: none;
        }
        .loader {
            border: 16px solid #f3f3f3; /* Light grey */
            border-top: 16px solid #8a8a8a;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: spin 2s linear infinite;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>

<div id="params" class="block nes-container with-title">
    <p class="title">Parameters</p>

    <a href="/history">History</a>
    <form id="imageForm">
        <label for="prompt">Prompt:</label>
        <textarea class="nes-textarea" id="prompt" name="prompt" value="black cat" rows="4" cols="60" required>black cat</textarea>

        <label for="height">Height:</label>
        <input class="nes-input" type="number" id="height" name="height" value=1024 required min="256" max="2048">

        <label for="width">Width:</label>
        <input class="nes-input" type="number" id="width" name="width" value=1024 required min="256" max="2048">

        <label for="steps">Steps:</label>
        <input class="nes-input" type="number" id="steps" namesteps="steps" value=5 required min="5" max="20">

        <label for="model">Model:</label>
        <div class="nes-select">
            <select name="model" id="model">
                <option value="@cf/stabilityai/stable-diffusion-xl-base-1.0">stable-diffusion-xl-base-1.0</option>
                <option value="@cf/lykon/dreamshaper-8-lcm">dreamshaper-8-lcm</option>
                <option value="@cf/bytedance/stable-diffusion-xl-lightning">stable-diffusion-xl-lightning</option>
            </select>
        </div>

        <button class="nes-btn is-success" id="button" type="submit">Generate Image</button>
    </form>
</div>

<div id="result" class="block nes-container with-title is-centered">
    <p class="title">Result</p>

    <img id="generatedImage" src="" alt="Generated Image">
    <div class="loader" id="loader"></div>
</div>

<script>
    document.getElementById('imageForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form submission

        const loader = document.getElementById('loader')
        loader.style.display = 'inline-block';

        const height = document.getElementById('height').value;
        const width = document.getElementById('width').value;
        const steps = document.getElementById('steps').value;
        const prompt = document.getElementById('prompt').value;
        const model = document.getElementById('model').value;

        const img = document.getElementById('generatedImage');
        img.style.display = 'none';
        img.src = \`/generated.png?height=\${height}&width=\${width}&steps=\${steps}&prompt=\${prompt}&model=\${model}\`;
        img.alt = prompt;

        img.addEventListener('load', () => {
            loader.style.display = 'none'
            img.style.display = 'inline-block'
        });

        const result = document.getElementById('result');
        result.style.display = 'block'; // Make the image visible when src is set
    });
</script>

</body>
</html>
`

export default indexHTML