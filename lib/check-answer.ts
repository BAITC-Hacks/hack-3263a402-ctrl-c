const normalize=(s:string)=>s.replace(/\r\n/g,"\n").split("\n").map(x=>x.trimEnd()).join("\n").trim();
// Preserve case, punctuation and internal whitespace: they can be the skill being tested.
export function matchesAnswer(answer:string,expected:string,equivalents:string[]=[]){return [expected,...equivalents].some(value=>normalize(answer)===normalize(value));}
