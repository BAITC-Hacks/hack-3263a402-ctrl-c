export function theorySectionId(title:string){
 return "theory-section-"+title.trim().replace(/^#{1,6}\s+/,"").replace(/\s+#+$/,"").replace(/[*_`]/g,"").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"");
}
