import BlitzApp from '../../blitz-app';
export default async function PublicBlitz({params}:{params:Promise<{id:string}>}){const {id}=await params;return <BlitzApp initialPublicId={id}/>;}
