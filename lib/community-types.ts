import type {Course} from './types';
export type Author={id:string;name:string;bio:string;createdAt:number};
export type Publication={id:string;title:string;description:string;subject:string;lessonCount:number;stageCount:number;readyCount:number;createdAt:number;updatedAt:number;likes:number;liked:boolean;own:boolean;author:Author;course?:Course;enrolledCourseId?:string|null;published?:boolean};
export type CommunityData={items:Publication[];hasMore:boolean;profile?:Author;total?:number;likes?:number};
export type CourseOrigin={publicationId:string;authorId:string;authorName:string};
