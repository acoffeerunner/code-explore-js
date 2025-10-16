import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Card } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
          {/* Decorative Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/20 blur-[100px] rounded-full opacity-30 pointer-events-none" />

          <div className="container mx-auto max-w-[1280px] px-6 lg:px-10 relative z-10">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
              {/* Hero Content */}
              <div className="flex flex-col gap-6 lg:w-1/2 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                  Understand Any <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
                    Codebase in Seconds
                  </span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-text-subtle max-w-[600px] mx-auto lg:mx-0 font-body">
                  CodeExplore uses advanced RAG technology to help developers
                  navigate, debug, and document complex repositories instantly.
                  Stop searching, start asking.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-2">
                  <Link href="/auth?mode=signup">
                    <Button
                      size="lg"
                      icon={
                        <span className="material-symbols-outlined text-[20px]">
                          rocket_launch
                        </span>
                      }
                    >
                      Get Started for Free
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="w-full lg:w-1/2 mt-10 lg:mt-0">
                <div className="relative rounded-xl border border-border-dark bg-surface-darker shadow-2xl overflow-hidden aspect-[4/3] group">
                  {/* Fake Browser Header */}
                  <div className="flex items-center gap-2 border-b border-border-dark bg-surface-dark px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-500/80" />
                      <div className="size-3 rounded-full bg-yellow-500/80" />
                      <div className="size-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="mx-auto text-xs font-mono text-gray-500">
                      main.py — CodeExplore
                    </div>
                  </div>
                  {/* Code Area */}
                  <div className="p-6 font-mono text-sm leading-relaxed text-gray-300 overflow-hidden relative h-full">
                    <div className="flex gap-4 opacity-80">
                      <div className="flex flex-col text-right text-gray-600 select-none">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                        <span>10</span>
                        <span>11</span>
                      </div>
                      <div className="flex flex-col">
                        <p>
                          <span className="text-primary">import</span> os
                        </p>
                        <p>
                          <span className="text-primary">from</span> rag_engine{" "}
                          <span className="text-primary">import</span>{" "}
                          CodeIndexer
                        </p>
                        <p>&nbsp;</p>
                        <p>
                          <span className="text-blue-400">class</span>{" "}
                          <span className="text-yellow-300">
                            RepositoryAnalyzer
                          </span>
                          :
                        </p>
                        <p>
                          &nbsp;&nbsp;
                          <span className="text-blue-400">def</span>{" "}
                          <span className="text-yellow-300">__init__</span>
                          (self, repo_path):
                        </p>
                        <p>&nbsp;&nbsp;&nbsp;&nbsp;self.path = repo_path</p>
                        <p>
                          &nbsp;&nbsp;&nbsp;&nbsp;self.indexer ={" "}
                          <span className="text-yellow-300">CodeIndexer</span>()
                        </p>
                        <p>&nbsp;</p>
                        <p>
                          &nbsp;&nbsp;
                          <span className="text-blue-400">def</span>{" "}
                          <span className="text-yellow-300">
                            analyze_context
                          </span>
                          (self, query):
                        </p>
                        <p>
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <span className="text-gray-500">
                            # Retrieve relevant snippets
                          </span>
                        </p>
                        <p>
                          &nbsp;&nbsp;&nbsp;&nbsp;context =
                          self.indexer.search(query)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 md:py-32" id="features">
          <div className="container mx-auto max-w-[1280px] px-6 lg:px-10">
            <div className="flex flex-col gap-4 text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
                Why developers choose CodeExplore
              </h2>
              <p className="text-slate-600 dark:text-text-subtle text-lg max-w-2xl mx-auto">
                Built for developers who need deep understanding, not just
                surface-level suggestions. We index your logic, not just your
                text.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card variant="bordered" hover className="flex flex-col gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    bolt
                  </span>
                </div>
                <h3 className="text-xl font-bold">Instant Context</h3>
                <p className="text-slate-500 dark:text-text-subtle leading-relaxed">
                  Stop searching blindly. Ask questions and get answers linked
                  directly to your code files with line-number precision.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card variant="bordered" hover className="flex flex-col gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    memory
                  </span>
                </div>
                <h3 className="text-xl font-bold">RAG Powered</h3>
                <p className="text-slate-500 dark:text-text-subtle leading-relaxed">
                  AI that understands your specific repository structure,
                  dependencies, and business logic using Retrieval-Augmented
                  Generation.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card variant="bordered" hover className="flex flex-col gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    shield_lock
                  </span>
                </div>
                <h3 className="text-xl font-bold">Enterprise Security</h3>
                <p className="text-slate-500 dark:text-text-subtle leading-relaxed">
                  Your code never leaves your secure environment. SOC2 compliant
                  and locally deployable for enterprise customers.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative">
          <div className="container mx-auto max-w-[960px] px-6 lg:px-10">
            <div className="relative rounded-2xl overflow-hidden border border-border-dark bg-surface-dark p-8 md:p-16 text-center shadow-2xl">
              {/* Background effects */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 size-64 rounded-full bg-primary/20 blur-[80px]" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-64 rounded-full bg-blue-600/20 blur-[80px]" />

              <div className="relative z-10 flex flex-col gap-6 items-center">
                <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                  Start exploring your code today
                </h2>
                <p className="text-lg text-slate-500 dark:text-text-subtle max-w-xl">
                  Join thousands of developers saving hours every week. No
                  credit card required for individual use.
                </p>
                <div className="w-full max-w-md mt-4">
                  <form className="flex flex-col gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="material-symbols-outlined text-gray-500">
                          mail
                        </span>
                      </div>
                      <input
                        className="block w-full rounded-lg border-0 bg-white dark:bg-[#31204b] py-4 pl-10 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-border-dark placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        placeholder="Enter your email address"
                        type="email"
                      />
                    </div>
                    <Link href="/auth?mode=signup">
                      <Button className="w-full" size="lg">
                        Sign Up Free
                      </Button>
                    </Link>
                  </form>
                  <p className="mt-4 text-xs text-gray-500">
                    By signing up, you agree to our{" "}
                    <Link className="underline hover:text-white" href="#">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link className="underline hover:text-white" href="#">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
