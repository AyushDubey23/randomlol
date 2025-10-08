"use client"

import { useState, useEffect } from "react"
import { Menu, X, Instagram, Linkedin, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const roles = [
  {
    title: "DIRECTOR",
    image: "/hero1.png",
    projects: [
      {
        title: "Crumbs or Traces?",
        category: "DOCUMENTARY",
        image: "/director1.png",
        videoUrl: "https://drive.google.com/file/d/1ONMIidN4gjZ_m0TdjttoKS0Pepdah0V8/view?usp=sharing",
        description:
          "Issued March, 2025 Adobe Certified Professional in Digital Video Using Adobe Premiere Pro SOFT SKILLS Visual storytelling Decisive and Problem-Solving Leadership Teamwork Communication Design Development Adobe Certified Professional in Visual Effects & Motion Graphics Using Adobe After Effects Issued March, 2025 -A short student documentary exploring the impact of web cookies and digital tracking on everyday users. -The film combines personal data analysis, street interviews, expert insights, and visual evidence to raise awareness about online privacy and data ethics",
        screenshots: [
          "d31.png",
          "d32.png",
          "d33.png",
          "d35.png",
          "d36.png",
          "d37.png",
          "d38.png",
          "d39.png",
          "d40.png",
          "d311.png",
          "d312.png",
          "d331.png",
          "d314.png",
        ],
      },
      {
        title: "Happy Hours with Ralf",
        category: "TALK SHOW",
        image: "/director2.png",
        videoUrl: "https://drive.google.com/file/d/1yIWB43aChruFhe2tYBcNfDi_h6f_v9bU/view?usp=drive_link",
        description:
          "Scriptwriter- ...Led the creative vision and execution of the episode in a student production, ensuring a cohesive narrative and engaging flow. -Directed talent and crew, managing on-set dynamics for a smooth production. -Oversaw shot composition, pacing, and performance to maintain the show's tone and energy.",
        screenshots: [
          "d21.png",
          "d22.png",
          "d23.png",
          "d24.png",
          "d25.png",
          "d26.png",
          "d27.png",
          "d28.png",
          "d29.png",
          "d30.png",
        ],
      },
      {
        title: "Babuji Dheere Chalna",
        category: "MUSIC VIDEO",
        image: "/director3.png",
        videoUrl: "https://drive.google.com/file/d/1whUopyByAXlyyLgewC594PHKf0z_sSxK/view?usp=drive_link",
        description:
          "Led a dynamic team of nine individuals, with the unique distinction of being the youngest member among them. -Wrote, story boarded and choreographed a story on an existing 1950s song -Executed the entire independent production cycle with efficiency and precision, within an impressive nine-day time frame.",
        screenshots: [
          "d11.png",
          "d12.png",
          "d13.png",
          "d14.png",
          "d112.png",
          "d15.png",
          "d111.png",
          "d16.png",
          "d17.png",
          "d18.png",
          "d19.png",
          "d20.png",
        ],
      },
    ],
  },
  {
    title: "EDITOR",
    image: "/home2.png",
    projects: [
      {
        title: "TRAPPED IN REVERIE",
        category: "SHORT FILM",
        image: "/home2.png",
        videoUrl: "https://drive.google.com/file/d/1WfxsnzBPR3S1jXdgoCUkfCA3VGWuh-mw/view",
        description:
          "Trapped In Reverie -Edited a student short film exploring the concept of lucid dreaming. -Assisted in colour grading using DaVinci Resolve, worked on sound design in Avid Pro Tools, and edited the film in Adobe Premiere Pro. -Also contributed as a gaffer on set, managing lighting to enhance the film’s visual narrative.",
        screenshots: ["e.png", "e2.png", "e3.png", "e5.png", "e6.png", "e7.png", "e8.png", "e9.png", "e10.png"],
      },
    ],
  },
  {
    title: "GAFFER",
    image: "/home21.png",
    projects: [
      {
        title: "TRAPPED IN REVERIE",
        category: "SHORT FILM",
        image: "/home21.png",
        videoUrl: "https://drive.google.com/file/d/1WfxsnzBPR3S1jXdgoCUkfCA3VGWuh-mw/view",
        description:
          "Trapped In Reverie -Edited a student short film exploring the concept of lucid dreaming. -Assisted in colour grading using DaVinci Resolve, worked on sound design in Avid Pro Tools, and edited the film in Adobe Premiere Pro. -Also contributed as a gaffer on set, managing lighting to enhance the film’s visual narrative.",
        screenshots: ["e.png", "e2.png", "e3.png", "e5.png", "e6.png", "e7.png", "e8.png", "e9.png", "e10.png"],
      },
    ],
  },
  {
    title: "PRODUCER",
    image: "/home3.png",
    projects: [
      {
        title: "AMERICAN BEAUTY",
        category: "SHORT FILM",
        image: "/home3.png",
        videoUrl: "https://drive.google.com/file/d/1WfxsnzBPR3S1jXdgoCUkfCA3VGWuh-mw/view",
        description:
          "Trapped In Reverie -Edited a student short film exploring the concept of lucid dreaming. -Assisted in colour grading using DaVinci Resolve, worked on sound design in Avid Pro Tools, and edited the film in Adobe Premiere Pro. -Also contributed as a gaffer on set, managing lighting to enhance the film’s visual narrative.",
        screenshots: ["p.png", "p2.png", "p3.png", "p5.png", "p6.png", "p7.png"],
      },
    ],
  },
  {
    title: "SOUND DESIGNER",
    image: "/home4.jpeg",
    projects: [
      {
        title: "COCAINE TOILET",
        category: "SHORT FILM",
        image: "/home4.jpeg",
        videoUrl: "https://www.youtube.com/watch?v=2JGmAgjSktk",
        description:
          "Trapped In Reverie -Edited a student short film exploring the concept of lucid dreaming. -Assisted in colour grading using DaVinci Resolve, worked on sound design in Avid Pro Tools, and edited the film in Adobe Premiere Pro. -Also contributed as a gaffer on set, managing lighting to enhance the film’s visual narrative.",
        screenshots: ["s.png", "s2.png", "s3.png", "s5.png", "s6.png", "s7.png", "s8.png", "s9.png", "s10.png"],
      },
    ],
  },
  {
    title: "SOUND OPERATOR",
    image: "/home5.png",
    projects: [
      {
        title: "NARCISSUS & ECHO",
        category: "SHORT FILM",
        image: "/home5.png",
        videoUrl: "https://www.youtube.com/watch?v=sGkA3N5AHv4",
        description:
          "Trapped In Reverie -Edited a student short film exploring the concept of lucid dreaming. -Assisted in colour grading using DaVinci Resolve, worked on sound design in Avid Pro Tools, and edited the film in Adobe Premiere Pro. -Also contributed as a gaffer on set, managing lighting to enhance the film’s visual narrative.",
        screenshots: ["o.png", "o2.png", "o3.png", "o5.png", "o6.png", "o7.png", "o8.png", "o9.png", "o10.png"],
      },
    ],
  },
  {
    title: "PHOTOGRAPHER",
    image: "/home6.png",
    projects: [
      { title: "Portrait Series", category: "NARRATIVE", image: "/photographer1.jpg" },
      { title: "Behind Scenes", category: "TRAILER", image: "/photographer2.jpg" },
      { title: "Street Photography", category: "DOCUMENTARY", image: "/photographer3.jpg" },
      { title: "Product Shots", category: "COMMERCIAL", image: "/photographer4.jpg" },
    ],
  },
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState("home")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [currentScreenshot, setCurrentScreenshot] = useState(0)

  const resetToHome = () => {
    setCurrentSection("home")
    setSelectedRole(null)
    setSelectedProject(null)
    setCurrentScreenshot(0)
  }

  const navigateToRole = (role: string) => {
    setSelectedRole(role)
    setSelectedProject(null)
    setCurrentSection("home")
    setCurrentScreenshot(0)
  }

  const navigateToBio = () => {
    setCurrentSection("bio")
    setSelectedRole(null)
    setSelectedProject(null)
    setCurrentScreenshot(0)
  }

  useEffect(() => {
    if (selectedProject && selectedProject.screenshots) {
      const interval = setInterval(() => {
        setCurrentScreenshot((prev) => (prev + 1) % selectedProject.screenshots.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedProject])

  const getEmbedUrl = (driveUrl: string) => {
    const fileId = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : driveUrl
  }

  const renderHome = () => (
    <div className="min-h-screen overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-[0.2em] text-black">HRIDAY BAJAJ</h1>
            <p className="text-xs text-gray-600 tracking-[0.15em] mt-1">FILM STUDENT</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hover:bg-transparent hamburger-icon"
          >
            <Menu className="h-5 w-5 text-black" />
          </Button>
        </div>
      </header>

      <div className="pt-20">
        <div className="space-y-6 px-0">
          {roles.map((role, index) => (
            <div
              key={role.title}
              className="relative h-[50vh] bg-gray-100 overflow-hidden group cursor-pointer tile-hover"
              onClick={() => setSelectedRole(role.title.toLowerCase().replace(/[^a-z]/g, ""))}
            >
              <img
                src={role.image || "/placeholder.svg"}
                alt={role.title}
                className="w-full h-full object-cover tile-image"
              />

              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <h2 className="text-white text-4xl md:text-6xl font-light tracking-[0.3em] tile-text">{role.title}</h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-8 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center space-x-8 mb-4">
            <a
              href="https://instagram.com/bajaj_hriday"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors social-icon"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/hridaybajaj019/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors social-icon"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=919559314530"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors social-icon"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
          <p className="text-center text-xs text-gray-500 tracking-wider">© 2024 Hriday Bajaj. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )

  const renderProjects = (roleTitle: string) => {
    const role = roles.find((r) => r.title.toLowerCase().replace(/[^a-z]/g, "") === roleTitle)
    if (!role) return null

    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <header className="fixed top-0 left-0 right-0 z-40 bg-background">
          <div className="container mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-[0.2em] text-black">HRIDAY BAJAJ</h1>
              <p className="text-xs text-gray-600 tracking-[0.15em] mt-1">FILM STUDENT</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-transparent hamburger-icon"
            >
              <Menu className="h-5 w-5 text-black" />
            </Button>
          </div>
        </header>

        <div className="pt-24 pb-16">
          <div className="px-0">
            <div className="space-y-0">
              {role.projects?.map((project, index) => (
                <div
                  key={project.title}
                  className="relative h-[40vh] bg-gray-100 overflow-hidden group cursor-pointer tile-hover"
                  onClick={() => setSelectedProject(project)}
                >
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover tile-image"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                    <div className="text-center text-white tile-text">
                      <div className="text-xs tracking-wider mb-2">{project.category}</div>
                      <div className="text-2xl md:text-4xl font-light tracking-wider">{project.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              variant="ghost"
              onClick={() => resetToHome()}
              className="text-gray-600 hover:text-black tracking-wider hover-scale"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderProjectDetail = (project: any, roleTitle: string) => {
    const role = roles.find((r) => r.title.toLowerCase().replace(/[^a-z]/g, "") === roleTitle)
    const otherProjects = role?.projects?.filter((p) => p.title !== project.title) || []

    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <header className="fixed top-0 left-0 right-0 z-40 bg-background">
          <div className="container mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-[0.2em] text-black">HRIDAY BAJAJ</h1>
              <p className="text-xs text-gray-600 tracking-[0.15em] mt-1">FILM STUDENT</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-transparent hamburger-icon"
            >
              <Menu className="h-5 w-5 text-black" />
            </Button>
          </div>
        </header>

        <div className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getEmbedUrl(project.videoUrl)}
                  className="w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-light tracking-wider text-black">{project.title}</h2>
                <div className="text-sm leading-relaxed text-gray-700 space-y-3">
                  {project.description
                    .split("-")
                    .map((line: string, index: number) => line.trim() && <p key={index}>{line.trim()}</p>)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`/${project.screenshots[currentScreenshot]}`}
                    alt={`${project.title} screenshot ${currentScreenshot + 1}`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {project.screenshots.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentScreenshot(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentScreenshot ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentScreenshot((prev) => (prev === 0 ? project.screenshots.length - 1 : prev - 1))
                    }
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setCurrentScreenshot((prev) => (prev + 1) % project.screenshots.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {otherProjects.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-light tracking-wider text-black">MORE TO DIRECTOR</h3>
                  <div className="space-y-0">
                    {otherProjects.map((otherProject, index) => (
                      <div
                        key={otherProject.title}
                        className="relative h-[30vh] bg-gray-100 overflow-hidden group cursor-pointer tile-hover"
                        onClick={() => setSelectedProject(otherProject)}
                      >
                        <img
                          src={otherProject.image || "/placeholder.svg"}
                          alt={otherProject.title}
                          className="w-full h-full object-cover tile-image"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <div className="text-center text-white tile-text">
                            <div className="text-xs tracking-wider mb-2">{otherProject.category}</div>
                            <div className="text-2xl md:text-3xl font-light tracking-wider">{otherProject.title}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => resetToHome()}
                  className="text-gray-600 hover:text-black tracking-wider hover-scale"
                >
                  ← Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderBio = () => (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-[0.2em] text-black">HRIDAY BAJAJ</h1>
            <p className="text-xs text-gray-600 tracking-[0.15em] mt-1">FILM STUDENT</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hover:bg-transparent hamburger-icon"
          >
            <Menu className="h-5 w-5 text-black" />
          </Button>
        </div>
      </header>

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <img src="/Hriday.jpg" alt="Hriday Bajaj" className="w-full max-w-md mx-auto lg:mx-0 grainy-effect" />
            </div>

            <div className="space-y-6 text-sm leading-relaxed text-gray-700">
              <p>
                <strong>Hriday Bajaj</strong> is a versatile Indian filmmaker and storyteller currently based in London.
                Born and raised in Lucknow, Uttar Pradesh, he developed a passion for filmmaking, project management,
                and collaborative creation. His work explores a diverse range of subjects, from contemporary social
                issues to imaginative visual narratives. Prior to his current studies, he gained industry experience as
                an intern at India TV, one of India's top national news channels. He is currently pursuing a BA (Hons)
                in Film and Television from the University of Arts London. His credits include directing the music video{" "}
                <em>Babuji Dheere Chalna</em>, producing the short film <em>American Beauty</em>, and editing the short
                film <em>Trapped in Reverie</em>.
              </p>

              <p>
                Hriday's directorial documentary, <em>Crumbs or Traces?</em>, investigates the pervasive impact of web
                cookies and digital tracking on everyday users. The film combines personal data analysis, street
                interviews, and expert insights to raise awareness about online privacy and data ethics. Hriday tells
                stories that leverage his adaptability and creative problem-solving, bringing a sharp sense of humor and
                strategic thinking to each production.
              </p>

              <p>
                He is a certified professional in both Adobe Premiere Pro and Adobe After Effects. He holds a BAFTA x
                ALBERT certification for Sustainable Media Industry Module and continues to develop his craft as a
                dedicated film student.
              </p>

              <div className="mt-8">
                <a
                  href="/HridayBajajResume.pdf"
                  download="Hriday_Bajaj_Resume.pdf"
                  className="inline-block px-6 py-3 bg-black text-white text-xs tracking-wider hover:bg-gray-800 transition-colors hover-scale"
                >
                  RESUME
                </a>
              </div>

              <p className="text-xs text-gray-500 mt-8">
                {" "}
                <a href="#" className="underline"></a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center space-x-8 text-sm">
            <a href="#" className="text-gray-600 hover:text-black transition-colors tracking-wider">
              IMDB
            </a>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 tracking-wider">CONTACT</span>
            <span className="text-gray-400">|</span>
            <a
              href="mailto:hridaybajaj@gmail.com"
              className="text-gray-600 hover:text-black transition-colors tracking-wider"
            >
              HRIDAYBAJAJ@GMAIL.COM
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background menu-overlay">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-6 right-6 hover:bg-transparent hamburger-icon"
          >
            <X className="h-5 w-5 text-black" />
          </Button>

          <div className="menu-content">
            <div className="text-center space-y-6">
              <button
                onClick={() => {
                  resetToHome()
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Home
              </button>
              <div className="w-12 h-px bg-black mx-auto"></div>

              <button
                onClick={() => {
                  navigateToRole("director")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Director
              </button>

              <button
                onClick={() => {
                  navigateToRole("editor")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Editor
              </button>

              <button
                onClick={() => {
                  navigateToRole("gaffer")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Gaffer
              </button>

              <button
                onClick={() => {
                  navigateToRole("producer")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Producer
              </button>

              <button
                onClick={() => {
                  navigateToRole("sounddesigner")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Sound Designer
              </button>

              <button
                onClick={() => {
                  navigateToRole("soundoperator")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Sound Operator
              </button>

              <button
                onClick={() => {
                  navigateToRole("photographer")
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Photographer
              </button>

              <button
                onClick={() => {
                  navigateToBio()
                  setIsMenuOpen(false)
                }}
                className="block text-2xl font-light tracking-[0.2em] text-black hover:text-gray-600 transition-colors menu-item"
              >
                Bio | Contact
              </button>
            </div>
          </div>

          <div className="menu-footer">
            <div className="flex items-center space-x-6">
              <a
                href="https://instagram.com/bajaj_hriday"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors social-icon"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/hridaybajaj019/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors social-icon"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=919559314530"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors social-icon"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {selectedProject ? (
        renderProjectDetail(selectedProject, selectedRole || "director")
      ) : selectedRole ? (
        renderProjects(selectedRole)
      ) : (
        <>
          {currentSection === "home" && renderHome()}
          {currentSection === "bio" && renderBio()}
        </>
      )}
    </div>
  )
}
