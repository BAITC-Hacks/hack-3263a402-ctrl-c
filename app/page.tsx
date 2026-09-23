import BlitzApp from "./blitz-app";
import {builtin,publicCourse} from "@/lib/course";
export default function Home(){return <BlitzApp initialCourse={publicCourse(builtin)}/>;}
