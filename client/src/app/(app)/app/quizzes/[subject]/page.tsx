import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import axios from 'axios';

import type { Metadata } from 'next'

const axiosAuth = axios.create()

const baseUrl = process.env.BASE_URL || ""

const serverUrl = process.env.SERVER_URL || ""

const cookiesInterceptor = async (req: any) => {
  const { cookies } = (await import("next/headers"))
  const cookiesString = cookies().getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ")
  req.headers.cookie = cookiesString
  return req
}

const AxiosService = axios.create({
  baseURL: baseUrl
})

AxiosService.interceptors.request.use(cookiesInterceptor)

AxiosService.interceptors.response.use(
  (res) => {
    return res
  }
)

export async function generateMetadata(
  { params }: { params: { subject: string } }
): Promise<Metadata> {
  return {
    title: `${params.subject} quizzes - Preppi`,
    description: `Discover ${params.subject} quizzes on Preppi!`
  }
}

function QuizOption({name, description, completed, id}: {name: string, description: string, completed: number, id: string}){
  return(
    <div className="group">
      <div className="rounded-xl bg-gradient-to-t from-black/5 to-white/90 p-8">
        <div>
          <h3 className="text-2xl font-bold">{name}</h3>
          <p className="text-neutral-600 group-hover:text-neutral-900 mt-1">{description}</p>
        </div>
        <div className="text-right mt-4">
          <p className="text-neutral-600 group-hover:text-neutral-900">{completed}% completed</p>
          <Progress value={completed} />
          <Button asChild className="mt-4">
            <Link href={`/app/quiz/${id}`}>Start quiz</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

async function getQuizzes(subject: string) {
  try {
    let response;
    if (subject === "all") {
      response = await axios.get(`${serverUrl}quizzes`);
    } else {
      response = await axios.get(`${serverUrl}quizzes?subject=${subject}`);
    }
    return response;
  } catch (error: any) {
    return error.response;
  }
}

async function getScore(id: number) { 
  try {
    const username = await AxiosService.post(`${serverUrl}checkAuthentication`, null, {withCredentials: true});

    const score = await axios.get(`${serverUrl}scores/users?username=${username.data}`);

    if (score.data === "User has no scores") return 0

    for (let i in score.data)
      if (score.data[i].quiz_id === id)
        return score.data[i].score;

  } catch (error) {
    console.log(error);
  }
  
  return 0
}

export default async function Page ({ params }: { params: { subject: string } }) {

    const response = await getQuizzes(params.subject);
    let retrievedQuizzes;

    if (response.status === 200) {
      
      try {
        retrievedQuizzes = response.data.map(async (quiz: any) => 

          {
            const score = await getScore(quiz.quiz_id);

            return (
                <div key={quiz.quiz_id}>
                <Button className="md:hidden"><FontAwesomeIcon icon={faChevronLeft} />&nbsp;&nbsp;{params.subject}</Button>
                <QuizOption name={quiz.quiz_name} description={quiz.quiz_desc} completed={score * 100} id={quiz.quiz_id}  />
                </div>
            ) 
          },
        );

      } catch {
        retrievedQuizzes = "No quizzes for that subject exist!"
      }

    } else {
      console.log(response.status);
      console.log(response.data);
    }

    return (
      <>
        {retrievedQuizzes}
      </>
    )
}