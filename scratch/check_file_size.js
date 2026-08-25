const url = 'https://begbdglouistmaughmot.supabase.co/storage/v1/object/public/notes/medicaps/1787482123420_604xn969s.docx';

fetch(url, { method: 'HEAD' })
.then(res => {
    console.log("Status:", res.status);
    console.log("Content-Length:", res.headers.get('content-length'));
    console.log("Content-Type:", res.headers.get('content-type'));
})
.catch(err => console.error("Error checking file:", err));
