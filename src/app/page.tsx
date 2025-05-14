
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, HelpCircle, Rocket, UploadCloud } from "lucide-react";
import Link from "next/link";
import type React from "react";

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <section className="text-center py-12 md:py-20">
        <Rocket className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Welcome to <span className="text-primary">ExamSim</span>!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Transform your PDF exam papers into interactive practice tests. ExamSim uses cutting-edge AI to help you prepare for your exams like never before.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6">
          <Link href="/upload">
            <UploadCloud className="mr-2 h-5 w-5" /> Get Started
          </Link>
        </Button>
      </section>

      <section className="py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://placehold.co/600x400.png?text=ExamSim+Interface" 
              alt="ExamSim Interface Illustration" 
              className="rounded-lg shadow-xl"
              data-ai-hint="app interface education"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold mb-6 flex items-center">
              <HelpCircle className="h-8 w-8 text-primary mr-3" /> What is ExamSim?
            </h2>
            <p className="text-muted-foreground mb-4 text-base leading-relaxed">
              ExamSim is an intelligent platform designed to make your exam preparation more effective and engaging. Simply upload your exam paper in PDF format, and our AI will:
            </p>
            <ul className="space-y-3 text-base">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 shrink-0" />
                <span>Analyze the PDF to understand its structure: subjects, sections, question types, duration, and marking schemes.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 shrink-0" />
                <span>Extract individual questions, their options, and identify correct answers.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 shrink-0" />
                <span>Provide an interactive test interface where you can attempt the exam under timed conditions.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 shrink-0" />
                <span>Generate a detailed performance report, highlighting your scores and areas for improvement.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-secondary/30 rounded-lg px-6">
        <h2 className="text-3xl font-semibold mb-8 text-center">
          Why Use <span className="text-primary">ExamSim</span>?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Realistic Practice", description: "Experience actual exam conditions with a timer and interactive question formats.", icon: "🎯" },
            { title: "Understand Structure", description: "Get a clear, AI-generated breakdown of your exam paper's subjects and sections.", icon: "🗺️" },
            { title: "Identify Weaknesses", description: "Analyze your performance section-wise to pinpoint areas needing more focus.", icon: "🔍" },
            { title: "Time Management", description: "Practice answering questions within the allocated time to improve your speed and efficiency.", icon: "⏱️" },
            { title: "Convenient & Smart", description: "Turn any PDF exam paper into a dynamic study tool, accessible anytime.", icon: "💡" },
            { title: "AI-Powered Insights", description: "Leverage AI to not just take tests, but to understand how they are structured.", icon: "🧠" }
          ].map((benefit) => (
            <Card key={benefit.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <span className="text-2xl mr-2">{benefit.icon}</span>
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-20">
        <h2 className="text-3xl font-semibold mb-10 text-center">
          How to Use <span className="text-primary">ExamSim</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Decorative line - optional */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-10" 
               style={{ width: 'calc(100% - 8rem)', margin: '0 4rem' }}></div>
          
          {[
            { step: 1, title: "Upload Your PDF", description: "Click 'Get Started' and select your exam paper (PDF format).", icon: <UploadCloud size={36} className="text-primary mb-3"/> },
            { step: 2, title: "Review Details", description: "Our AI analyzes the PDF. Review the extracted exam structure, subjects, and sections.", icon: <CheckCircle size={36} className="text-primary mb-3"/> },
            { step: 3, title: "Take the Test", description: "Start the interactive exam. Navigate sections, answer questions, and manage your time.", icon: <Rocket size={36} className="text-primary mb-3"/> },
            { step: 4, title: "Get Results", description: "After submission, receive a detailed performance report with scores and insights.", icon: <HelpCircle size={36} className="text-primary mb-3"/> }
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center p-4 z-0">
              <div className="bg-card border-2 border-primary rounded-full w-16 h-16 flex items-center justify-center text-primary text-2xl font-bold mb-4 relative">
                {item.step}
              </div>
              {item.icon}
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/upload">
              <UploadCloud className="mr-2 h-5 w-5" /> Upload and Analyze Now
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
