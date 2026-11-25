import { getPayload } from "payload";
async function loadEnvFile(filePath: string){try{const fs=await import("fs");const envFile=fs.readFileSync(filePath,"utf-8");for(const line of envFile.split("\n")){const t=line.trim();if(t&&!t.startsWith("#")){const i=t.indexOf("=");if(i>0){const k=t.slice(0,i).trim();const v=t.slice(i+1).trim();if(k&&process.env[k]===undefined)process.env[k]=v;}}}}catch{}}
await loadEnvFile(".env.local");
const configModule=await import("../payload.config.ts");
const payload=await getPayload({config:configModule.default});
const files=["shop-product-1.jpeg","shop-product-2.jpeg"];
const products=await payload.find({collection:"products",limit:2,sort:"createdAt",pagination:false});
for(let i=0;i<files.length;i++){
  const p=products.docs[i];
  if(!p) break;
  const media=await payload.create({collection:"media",data:{alt:p.name},filePath:"public/uploads/seed/"+files[i]});
  await payload.update({collection:"products",id:p.id,data:{image:media.id}});
  console.log("assigned",files[i],"to",p.name);
}
process.exit(0);
