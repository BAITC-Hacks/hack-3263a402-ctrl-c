import BlitzApp from '../../blitz-app';
export default async function PublicProfile({params}:{params:Promise<{id:string}>}){const {id}=await params;return <BlitzApp initialProfileId={id}/>;}
