/*
 * Image generation service using Cloudflare APIs
 * Copyright (C) 2024 Gauthier Jolly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import indexHTML from "./index.html"

const keyList = "list"

async function getList(env) {
  return await env.IMAGE_KV.get(keyList, "json") ?? ({})
}

async function addToList(env, key, metadata) {
  const list = await getList(env)
  list[key] = metadata

  await env.IMAGE_KV.put(keyList, JSON.stringify(list))
}

async function removeFromList(env, key) {
  const list = await env.IMAGE_KV.get(keyList, "json")
  delete list[key]

  await env.IMAGE_KV.put(keyList, JSON.stringify(list))
}

async function generate(request, env, ctx) {
  const url = new URL(request.url);
  const model = url.searchParams.get("model")

  const inputs = {
    num_steps: Number.parseInt(url.searchParams.get("steps")),
    height: Number.parseInt(url.searchParams.get("height")),
    width: Number.parseInt(url.searchParams.get("width")),
    prompt: url.searchParams.get("prompt"),
  };

  if (url.searchParams.get("negative_prompt") !== "") {
    inputs.negative_prompt = url.searchParams.get("negative_prompt");
  }

  console.log(inputs)
  const response = await env.AI.run(
    model,
    inputs,
  );

  const [toReturn, toStore] = response.tee();
  const imageKey = `${Date.now()}.png`

  ctx.waitUntil(env.IMAGE_KV.put(imageKey, toStore, {
    metadata: {prompt: inputs.prompt},
  }))

  await addToList(env, imageKey, {
    prompt: inputs.prompt,
  })

  return new Response(toReturn, {
    headers: {
      'content-type': 'image/png',
    },
  });
}

async function history(request, env) {
  const list = await getList(env)

  const htmlList = Object.entries(list).sort(((a, b) => a[0].localeCompare(b[0]) )).map(([name, metadata]) => {
    return `<li><a href="/image/${name}">${metadata?.prompt}</a> (<a href="#" onclick="deleteImage('/image/${name}')">delete</a>)</li>`
  }).join('\n')

  const htmlPage = `
  <!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nes.css/2.3.0/css/nes.min.css" integrity="sha512-LVdzC5GAu4VEEGcarpj2jruxNUONmGEMdcc6AL7a7nSHR7QAmyLfx3SUPCSSFsNZPuZLQInrUSkqWYHpyOYeRg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 20px;
        }
      </style>
    </head>
  <body>
    <main>
      <a href="/">back</a>
      <div class="nes-container with-title">
        <p class="title">History</p>
        <ul nes-list is-circle>
          ${htmlList}
        </ul>
      </div>
    </main>
  </body>
  <script>
  function deleteImage(url) {
    fetch(url, { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          location.reload(true);
        } else {
          alert('Failed to delete image.');
        }
      })
      .catch(error => {
        console.error('Error deleting image:', error);
        alert('An error occurred while deleting the image.');
      });
  }
  </script>
  </html>
`
  return new Response(htmlPage, {headers: {
    "Content-Type": "text/html",
  }})
}


async function reconciliateHistory(request, env) {
  let list = await getList(env)
  console.log(list)

  const value = await env.IMAGE_KV.list()
  value.keys.forEach(k => {
    if (!(Object.keys(list).includes(k.name))) {
      list[k.name] = {prompt: k.metadata.prompt}
    }
  })

  await env.IMAGE_KV.put(keyList, JSON.stringify(list))

  return new Response()
}

async function image(request, env) {
  const url = new URL(request.url)
  const imageName = url.pathname.split("/").pop()
  if (imageName === "") {
    return new Response("bad request", {status: 400})
  }

  const image = await env.IMAGE_KV.get(imageName, "stream")

  if (request.method === "DELETE"){
    await env.IMAGE_KV.delete(imageName)
    await removeFromList(env, imageName)
    return new Response()
  }

  if (image === null) {
    return new Response("image not found", {status: 404})
  }

  return new Response(image, {headers:{
    "Content-Type": "image/png",
    "Cache-Control": "max-age=3600",
  }})
}

async function index() {
  return new Response(indexHTML, {headers: {
    "Content-Type": "text/html",
    "Cache-Control": "max-age=60",
  }})
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/generated.png")) {
      return generate(request, env, ctx);
    }
    if (url.pathname.startsWith("/history")){
      return history(request, env)
    }
    if (url.pathname.startsWith("/image")){
      return image(request, env)
    }
    if (url.pathname.startsWith("/reconciliate")){
      return reconciliateHistory(request, env)
    }
    return index();
  },
};
