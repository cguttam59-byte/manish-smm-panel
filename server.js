const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Uttam@1234';
if (ADMIN_PASSWORD.length < 10) {
  console.error('Set ADMIN_PASSWORD to a password of at least 10 characters before starting.');
  process.exit(1);
}
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(DATA_DIR, {recursive:true});
fs.mkdirSync(UPLOAD_DIR, {recursive:true});
const DB = path.join(DATA_DIR, 'orders.json');
if (!fs.existsSync(DB)) fs.writeFileSync(DB, '[]');
const readOrders = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const writeOrders = orders => fs.writeFileSync(DB, JSON.stringify(orders, null, 2));
const tokens = new Map();
app.use(express.json({limit:'20kb'}));
app.use(express.static(path.join(__dirname,'public')));
const storage = multer.diskStorage({
 destination: (_req,_file,cb)=>cb(null,UPLOAD_DIR),
 filename: (_req,file,cb)=>cb(null,crypto.randomUUID()+path.extname(file.originalname).toLowerCase())
});
const upload = multer({storage, limits:{fileSize:5*1024*1024}, fileFilter:(_req,file,cb)=>{
 if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(new Error('Upload a JPG, PNG, or WEBP screenshot.'));
 cb(null,true);
}});
function auth(req,res,next){const t=(req.headers.authorization||'').replace(/^Bearer /,'');if(!tokens.has(t))return res.status(401).json({error:'Please log in again.'});next();}
app.post('/api/orders', upload.single('paymentScreenshot'), (req,res)=>{
 const youtubeChannel=String(req.body.youtubeChannel||'').trim();
 const packageName=String(req.body.packageName||'').trim();
 const amount=Number(req.body.amount);
 let u; try{u=new URL(youtubeChannel)}catch{return res.status(400).json({error:'Enter a valid YouTube channel URL.'})}
 if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be'].includes(u.hostname.toLowerCase())) return res.status(400).json({error:'Please submit a YouTube channel link.'});
 if(!req.file)return res.status(400).json({error:'Payment screenshot is required.'});
 if(!packageName || ![10,99,999].includes(amount)) {fs.unlink(req.file.path,()=>{});return res.status(400).json({error:'Invalid package or amount.'});}
 const orders=readOrders();
 const order={id:crypto.randomUUID(),youtubeChannel,packageName,amount,status:'pending',createdAt:new Date().toISOString(),screenshotFile:req.file.filename};
 orders.unshift(order);writeOrders(orders);
 res.status(201).json({ok:true,id:order.id});
});
app.post('/api/admin/login',(req,res)=>{
 if(!req.body || !crypto.timingSafeEqual(Buffer.from(String(req.body.password||'').padEnd(256,'\0').slice(0,256)),Buffer.from(ADMIN_PASSWORD.padEnd(256,'\0').slice(0,256))))return res.status(401).json({error:'Incorrect password.'});
 const token=crypto.randomBytes(32).toString('hex');tokens.set(token,Date.now()+8*60*60*1000);res.json({token});
});
app.use('/api/admin', (req,res,next)=>{const t=(req.headers.authorization||'').replace(/^Bearer /,'');const expiry=tokens.get(t);if(!expiry||expiry<Date.now()){tokens.delete(t);return res.status(401).json({error:'Session expired.'})}next()});
app.get('/api/admin/orders',(req,res)=>{const status=['pending','approved','rejected'].includes(req.query.status)?req.query.status:'pending';const orders=readOrders().filter(o=>o.status===status).map(o=>({...o,screenshotUrl:'/api/admin/orders/'+o.id+'/screenshot'}));res.json({orders})});
app.get('/api/admin/orders/:id/screenshot',(req,res)=>{const o=readOrders().find(o=>o.id===req.params.id);if(!o)return res.sendStatus(404);const file=path.join(UPLOAD_DIR,path.basename(o.screenshotFile));if(!fs.existsSync(file))return res.sendStatus(404);res.setHeader('Cache-Control','no-store');res.sendFile(file)});
app.patch('/api/admin/orders/:id',(req,res)=>{const status=req.body?.status;if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Invalid status.'});const orders=readOrders();const o=orders.find(o=>o.id===req.params.id);if(!o)return res.sendStatus(404);if(o.status!=='pending')return res.status(409).json({error:'This order has already been reviewed.'});o.status=status;o.reviewedAt=new Date().toISOString();writeOrders(orders);res.json({ok:true,status})});
app.use((err,req,res,next)=>{if(err instanceof multer.MulterError)return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Screenshot must be 5 MB or smaller.':err.message});res.status(400).json({error:err.message||'Request failed.'})});
app.listen(PORT,()=>console.log(`Manish SMM Panel running on port ${PORT}`));
