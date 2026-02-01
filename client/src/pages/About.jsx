import Header from "../components/Header";

const About = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 shadow-xl">
              <span className="text-4xl">🎯</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              About Tambola
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The ultimate online Tambola (Housie) gaming platform for fun gatherings and memorable moments!
            </p>
          </div>

          {/* About Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">What is Tambola?</h3>
              <p className="text-gray-600 leading-relaxed">
                Tambola, also known as Housie or Indian Bingo, is a popular game of chance played at social gatherings, 
                parties, and family events. Players mark numbers on their tickets as they are called out, 
                aiming to complete winning patterns.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Our Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                We bring the traditional Tambola experience online! Host virtual games with friends and family, 
                no matter where they are. Real-time gameplay, instant winning detection, and seamless 
                multiplayer experience.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Winning Patterns</h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple exciting winning patterns including Early Five, Top Line, Middle Line, Bottom Line, 
                Four Corners, and the ultimate Full House! Each pattern brings its own thrill and rewards.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Play Together</h3>
              <p className="text-gray-600 leading-relaxed">
                Create rooms, invite friends via unique codes or links, and enjoy a synchronized gaming experience. 
                Perfect for kitty parties, office events, family gatherings, and virtual celebrations!
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">✨ Key Features</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: "⚡", text: "Real-time Gameplay" },
                { icon: "🎟️", text: "Auto Ticket Generation" },
                { icon: "🔔", text: "Instant Win Detection" },
                { icon: "📱", text: "Mobile Friendly" },
                { icon: "🔗", text: "Easy Room Sharing" },
                { icon: "👨‍💼", text: "Host Controls" },
                { icon: "🎨", text: "Beautiful UI" },
                { icon: "🔒", text: "Secure & Private" },
                { icon: "🆓", text: "Free to Play" },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl px-4 py-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Play Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">🎲 How to Play</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Register", desc: "Create your free account" },
                { step: "2", title: "Host or Join", desc: "Create a room or join one" },
                { step: "3", title: "Get Tickets", desc: "Receive your game ticket" },
                { step: "4", title: "Play & Win!", desc: "Mark numbers and claim prizes" },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    {item.step}
                  </div>
                  <h4 className="font-bold mb-1">{item.title}</h4>
                  <p className="text-purple-100 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
