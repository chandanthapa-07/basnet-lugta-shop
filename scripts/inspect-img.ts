import { getPayload } from "payload";
async function loadEnvFile(filePath: string){try{const fs=await import("fs");const envFile=fs.readFileSync(filePath,"utf-8");for(const line of envFile.split("\n")){const t=line.trim();if(t&&!t.startsWith("#")){const i=t.indexOf("=");if(i>0){const k=t.slice(0,i).trim();const v=t.slice(i+1).trim();if(k&&process.env[k]===undefined)process.env[k]=v;}}}}catch{}}
await loadEnvFile(".env.local");
const configModule=await import("../payload.config.ts");
const payload=await getPayload({config:configModule.default});
const products=await payload.find({collection:"products",limit:100,pagination:false,depth:1});
for(const p of products.docs){console.log(p.name,"image=",JSON.stringify(p.image));}
const media=await payload.find({collection:"media",limit:100,pagination:false});
console.log("MEDIA COUNT",media.docs.length);
for(const m of media.docs){console.log("MEDIA",m.id,m.filename,m.url);}
process.exit(0);
