const tariffs={
 Delhi:{domestic:{slabs:[[100,2],[200,3],[400,4.5],[Infinity,6.5]],fixed:40,subsidyRate:.10,taxRate:.05},commercial:{slabs:[[100,5.5],[200,6.5],[400,7.5],[Infinity,8.5]],fixed:100,subsidyRate:0,taxRate:.08}},
 Haryana:{domestic:{slabs:[[100,2.5],[200,3.5],[400,5],[Infinity,7]],fixed:50,subsidyRate:.05,taxRate:.05},commercial:{slabs:[[100,6],[200,7],[400,8],[Infinity,9]],fixed:120,subsidyRate:0,taxRate:.08}},
 Mumbai:{domestic:{slabs:[[100,3],[200,4],[400,5.5],[Infinity,7.5]],fixed:60,subsidyRate:.05,taxRate:.08},commercial:{slabs:[[100,6.5],[200,7.5],[400,8.5],[Infinity,9.5]],fixed:150,subsidyRate:0,taxRate:.10}}
};
let selectedRegion='Delhi',latestBill=null;
const $=id=>document.getElementById(id);
const money=n=>'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=new Date();
const dateNow=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
$('billingMonth').value=dateNow;

document.querySelectorAll('.region-card').forEach(card=>card.addEventListener('click',()=>{
 document.querySelectorAll('.region-card').forEach(c=>c.classList.remove('active'));
 card.classList.add('active');selectedRegion=card.dataset.region;
 if(latestBill)runCalculation(latestBill.units);
}));

function getTariffResult(units,region,type){
 const p=tariffs[region][type];let remaining=units,previous=0,energy=0;
 for(const [limit,rate] of p.slabs){const qty=Math.max(0,Math.min(remaining,limit-previous));energy+=qty*rate;remaining-=qty;previous=limit;if(remaining<=0)break;}
 const fixed=p.fixed,subsidy=energy*p.subsidyRate,tax=(energy+fixed-subsidy)*p.taxRate;
 return {energy,fixed,subsidy,tax,total:Math.max(0,energy+fixed-subsidy+tax)};
}
function buildBill(units,result){
 const name=$('customerName').value.trim(),type=$('connectionType').value;
 const month=$('billingMonth').value||dateNow;
 const ref='VW-'+Date.now().toString().slice(-8);
 return {...result,units,region:selectedRegion,type,name:name||'Guest Customer',customerId:$('customerId').value.trim(),meterNumber:$('meterNumber').value.trim(),address:$('address').value.trim(),month,reference:ref,createdAt:new Date().toLocaleString('en-IN')};
}
async function runCalculation(units){
 const type=$('connectionType').value;let result;
 if(typeof window.createBillEngine==='function'){
   try{const engine=await window.createBillEngine();result=engine.calculate(units,selectedRegion,type);}
   catch(error){console.error('C++ WebAssembly engine could not load; using preview calculation.',error);result=getTariffResult(units,selectedRegion,type);}
 }else result=getTariffResult(units,selectedRegion,type);
 latestBill=buildBill(units,result);renderBill(latestBill);
}
function renderBill(b){
 $('emptyState').hidden=true;$('billResult').hidden=false;
 $('totalAmount').textContent=money(b.total);$('payable').textContent=money(b.total);
 $('billNumber').textContent=b.reference;
 $('resultCaption').textContent=`${b.units} units · ${b.region} · ${b.type}`;
 $('periodCaption').textContent=b.month.toUpperCase();
 $('outName').textContent=b.name;$('outAddress').textContent=b.address||'Address not provided';
 $('outConnection').textContent=b.type==='domestic'?'Domestic':'Commercial';
 $('outConsumer').textContent=b.customerId||'ID not provided';
 $('energyCharge').textContent=money(b.energy);$('fixedCharge').textContent=money(b.fixed);
 $('subsidy').textContent='− '+money(b.subsidy);$('tax').textContent=money(b.tax);
 document.querySelector('.statement-status').innerHTML='<i></i> ESTIMATE GENERATED';
}
$('previousReading').addEventListener('input',syncReadings);
$('currentReading').addEventListener('input',syncReadings);
function syncReadings(){
 const prev=$('previousReading').value,curr=$('currentReading').value;
 if(prev!==''&&curr!==''){
  const p=Number(prev),c=Number(curr);
  if(c>=p){$('units').value=c-p;$('readingHint').textContent=`Units calculated automatically: ${c-p} kWh.`;}
  else $('readingHint').textContent='Current reading cannot be lower than previous reading.';
 }else $('readingHint').textContent='Enter the units consumed, or add both readings to calculate units automatically.';
}
$('billForm').addEventListener('submit',e=>{
 e.preventDefault();
 const units=Number($('units').value),prev=$('previousReading').value,curr=$('currentReading').value;
 if(prev!==''&&curr!==''&&Number(curr)<Number(prev)){alert('Current meter reading must be greater than or equal to previous reading.');return;}
 if(!Number.isFinite(units)||units<0||units>100000){alert('Enter a valid unit value from 0 to 100,000.');return;}
 runCalculation(units);
});
function pdfText(doc,text,x,y,maxWidth){doc.text(String(text||'—'),x,y,{maxWidth});}
// jsPDF's built-in Helvetica font does not contain the Indian rupee glyph.
// Use an explicit INR label in the PDF so it never renders as a stray '1' or superscript.
const pdfMoney=n=>'INR '+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
$('downloadBtn').addEventListener('click',()=>{
 if(!latestBill)return;
 if(!window.jspdf?.jsPDF){alert('PDF library could not load. Please check your internet connection and try again.');return;}
 const b=latestBill,{jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'});
 const pageW=210,margin=18;
 // Brand header
 doc.setFillColor(8,22,39);doc.rect(0,0,pageW,49,'F');
 // Draw a crisp vector lightning-bolt brand mark (no external image or missing-font glyph).
 doc.setFillColor(83,220,207);doc.roundedRect(margin,13,17,17,4,4,'F');
 doc.setFillColor(8,22,39);doc.lines([[7,-0.5],[-4,7],[3,0],[ -2,7],[8,-9],[-4,0],[2,-5]],margin+4.5,18.5,[1,1],'F',true);
 doc.setTextColor(255,255,255);doc.setFontSize(18);doc.text('VOLTWISE',margin+23,21);
 doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(167,195,207);doc.text('ENERGY MADE CLEAR  |  ELECTRICITY ESTIMATE',margin+23,27);
 doc.setTextColor(96,228,211);doc.setFontSize(8);doc.text('ACADEMIC DEMO STATEMENT',pageW-margin,20,{align:'right'});
 doc.setTextColor(206,221,233);doc.text('NOT AN OFFICIAL UTILITY INVOICE',pageW-margin,27,{align:'right'});
 // Reference and total
 doc.setTextColor(75,91,108);doc.setFontSize(8);doc.text('ESTIMATE REFERENCE',margin,61);
 doc.setTextColor(12,35,53);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(b.reference,margin,68);
 doc.setTextColor(75,91,108);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('GENERATED',pageW-margin,61,{align:'right'});
 doc.setTextColor(12,35,53);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(b.createdAt,pageW-margin,68,{align:'right'});
 doc.setFillColor(239,248,247);doc.roundedRect(margin,78,pageW-2*margin,32,3,3,'F');
 doc.setTextColor(75,91,108);doc.setFontSize(8);doc.text('TOTAL ESTIMATED PAYABLE',margin+7,89);
 doc.setTextColor(8,48,62);doc.setFont('helvetica','bold');doc.setFontSize(23);doc.text(pdfMoney(b.total),margin+7,102);
 doc.setTextColor(75,91,108);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(`${b.units} kWh  |  ${b.region}  |  ${b.type.toUpperCase()}`,pageW-margin-7,101,{align:'right'});
 // Customer details
 let y=120;doc.setTextColor(8,48,62);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('CUSTOMER & CONNECTION DETAILS',margin,y);
 doc.setDrawColor(218,227,234);doc.line(margin,y+4,pageW-margin,y+4);
 y+=13;const col2=111;
 const detail=(label,value,x,yy,width=76)=>{doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(105,122,137);doc.text(label.toUpperCase(),x,yy);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(22,43,60);const lines=doc.splitTextToSize(String(value||'Not provided'),width);doc.text(lines,x,yy+6);return lines.length;};
 detail('Customer name',b.name,margin,y);detail('Consumer / account ID',b.customerId,col2,y);
 detail('Meter number',b.meterNumber,margin,y+17);detail('Billing date',b.month,col2,y+17);
 const addressLines=detail('Service address',b.address||'Not provided',margin,y+34,82);
 detail('Connection category',b.type,col2,y+34);
 // Keep the next section clear of wrapped address lines.
 y += 45 + Math.max(0,addressLines-1)*3;
 doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(8,48,62);doc.text('METER & USAGE',margin,y);
 doc.setDrawColor(218,227,234);doc.line(margin,y+4,pageW-margin,y+4);
 y+=11;doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(75,91,108);
 const prev=$('previousReading').value||'Not entered',curr=$('currentReading').value||'Not entered';
 doc.text(`Previous reading: ${prev}`,margin,y);doc.text(`Current reading: ${curr}`,75,y);doc.text(`Units consumed: ${b.units} kWh`,145,y);
 // Charge table
 y+=14;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(8,48,62);doc.text('ITEMISED CHARGE BREAKDOWN',margin,y);
 y+=6;doc.setFillColor(8,22,39);doc.rect(margin,y,pageW-2*margin,8,'F');
 doc.setTextColor(255,255,255);doc.setFontSize(7);doc.text('DESCRIPTION',margin+4,y+5.5);doc.text('AMOUNT (INR)',pageW-margin-4,y+5.5,{align:'right'});
 const rows=[['Energy charges',b.energy],['Fixed service charges',b.fixed],['Demo subsidy adjustment',-b.subsidy],['Tax / duty estimate',b.tax]];
 y+=8;rows.forEach((r,i)=>{if(i%2===0){doc.setFillColor(246,249,251);doc.rect(margin,y,pageW-2*margin,8.5,'F');}doc.setTextColor(45,62,78);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(r[0],margin+4,y+5.8);doc.setFont('helvetica','bold');doc.text((r[1]<0?'- ':'')+pdfMoney(Math.abs(r[1])),pageW-margin-4,y+5.8,{align:'right'});y+=8.5;});
 doc.setFillColor(230,247,244);doc.rect(margin,y,pageW-2*margin,11,'F');doc.setTextColor(8,48,62);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('AMOUNT PAYABLE',margin+4,y+7.5);doc.setTextColor(0,120,111);doc.text(pdfMoney(b.total),pageW-margin-4,y+7.5,{align:'right'});
 // Place the footer after the amount box with a real gap; never draw it over the total row.
 y += 18;doc.setDrawColor(218,227,234);doc.line(margin,y,pageW-margin,y);
 doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(8,48,62);doc.text('VOLTWISE  |  ENERGY MADE CLEAR',margin,y+6);
 doc.setFont('helvetica','normal');doc.setTextColor(100,115,129);doc.setFontSize(7);
 doc.text('This educational estimate uses illustrative demo tariff values. It is not an official bill,',margin,y+12);
 doc.text('payment request, or confirmation of charges from any electricity distribution company.',margin,y+16);
 doc.save(`VoltWise-Electricity-Estimate-${b.reference}.pdf`);
});
function historyItems(){try{return JSON.parse(localStorage.getItem('voltwise-premium-history')||'[]')}catch{return[]}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderHistory(){const items=historyItems();$('historyList').innerHTML=items.length?items.map(b=>`<div class="history-entry"><div><strong>${escapeHtml(b.name)}</strong><small>${escapeHtml(b.region)} · ${b.units} kWh · ${escapeHtml(b.month)}</small></div><b>${money(b.total)}</b></div>`).join(''):'<div class="history-empty"><span>◷</span><p>Your saved calculations will appear here.</p></div>';}
$('saveBtn').addEventListener('click',()=>{if(!latestBill)return;const items=historyItems();items.unshift(latestBill);localStorage.setItem('voltwise-premium-history',JSON.stringify(items.slice(0,12)));renderHistory();$('saveBtn').textContent='✓';setTimeout(()=>$('saveBtn').textContent='＋',1100);});
$('clearHistory').addEventListener('click',()=>{localStorage.removeItem('voltwise-premium-history');renderHistory();});
$('themeToggle').addEventListener('click',()=>document.body.classList.toggle('light'));
renderHistory();

// Gentle scroll reveal for feature cards and sections (respects reduced-motion preference).
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
 document.querySelectorAll('.region-block,.calculator-layout,.insights-section,.history-section,.insight-card').forEach(el=>{
  el.classList.add('reveal-on-scroll');
 });
 const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});
 },{threshold:.08});
 document.querySelectorAll('.reveal-on-scroll').forEach(el=>revealObserver.observe(el));
}
