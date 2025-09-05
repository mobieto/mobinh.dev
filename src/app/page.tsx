import Image from "next/image";
import Legend from "@/app/components/legend";
import { ReactLenis } from "@/lib/lenis"

export default function Home() {
  return (
    <>
      <ReactLenis root>
        <Legend />

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="max-w-xl w-full text-center">
            <Image
              src="/profile.jpg" // Place your profile image in public/profile.jpg
              alt="Profile"
              width={120}
              height={120}
              className="rounded-full mx-auto mb-6 shadow-lg"
            />
            <p className="text-lg text-gray-700 mb-6">
              Hello ! I'm Mobin, a computer science grad with an interest in cloud systems and AI.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://github.com/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                LinkedIn
              </a>
              <a
                href="mailto:youremail@example.com"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </ReactLenis>
    </>
  );
}
