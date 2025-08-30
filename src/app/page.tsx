import Image from "next/image";
import HomeScene from "./components/home3D";

export default function Home() {
  return (
    <>
      <HomeScene />

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-xl w-full text-center">
          <Image
            src="/profile.jpg" // Place your profile image in public/profile.jpg
            alt="Profile"
            width={120}
            height={120}
            className="rounded-full mx-auto mb-6 shadow-lg"
          />
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Mobin H</h1>
          <p className="text-lg text-gray-700 mb-6">
            Hi! I'm Mobin. I'm a comp sci grad with a keen interest in web/cloud technologies and AI.
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
    </>
  );
}
