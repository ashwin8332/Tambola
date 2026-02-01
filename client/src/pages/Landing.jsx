import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    {
      icon: '🎮',
      title: 'Easy Game Management',
      description: 'Create and manage Tambola games with just a few clicks. Schedule games, set patterns, and manage players effortlessly.'
    },
    {
      icon: '🎨',
      title: 'Multiple Patterns',
      description: 'Choose from various winning patterns - Early Five, First Line, Full House, Corners, and more!'
    },
    {
      icon: '👥',
      title: 'Real-Time Multiplayer',
      description: 'Invite friends and family to join your game instantly. Play together from anywhere!'
    },
    {
      icon: '📊',
      title: 'Live Number Draw',
      description: 'Watch numbers being drawn in real-time with voice announcements. Never miss a number!'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Play from any device - phone, tablet, or desktop. Responsive design for the best experience.'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Built with modern security practices. Your games run smoothly without interruptions.'
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Create a Room',
      description: 'Sign up as a host and create your game room with custom patterns.'
    },
    {
      step: '2',
      title: 'Share the Link',
      description: 'Invite players by sharing your unique room link.'
    },
    {
      step: '3',
      title: 'Start Playing',
      description: 'Begin drawing numbers and let the fun begin!'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Host',
      content: 'Tambola has made our family gatherings so much more fun! Easy to set up and everyone loves it.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'Player',
      content: 'Love playing Tambola with friends online. The interface is super smooth and easy to use!',
      rating: 5
    },
    {
      name: 'Amit Patel',
      role: 'Host',
      content: 'Perfect for kitty parties and group events. My guests always ask when the next game is!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🎯</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                Tambola
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/login"
                className="px-4 py-2 text-gray-500 hover:text-purple-600 font-medium transition-colors text-sm"
              >
                Admin
              </Link>
              <Link
                to="/auth"
                className="px-6 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 bg-gradient-to-br from-rose-100 via-blue-50 to-purple-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-rose-200/50 to-purple-200/50 rounded-full text-purple-700 font-semibold text-sm border border-purple-200">
                🎉 The Classic Indian Game - Now Online!
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-rose-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Play Tambola
              </span>
              <br />
              <span className="text-gray-800">Anytime, Anywhere</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Host exciting Tambola games for friends, family, or events. Create rooms, invite players, and enjoy the thrill of the classic Housie game online!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/auth"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all flex items-center space-x-2"
              >
                <span>🚀</span>
                <span>Start Playing Free</span>
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center space-x-2"
              >
                <span>📖</span>
                <span>How It Works</span>
              </a>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Active Hosts</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">10K+</div>
                <div className="text-gray-600">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-rose-500 mb-2">50K+</div>
                <div className="text-gray-600">Happy Players</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce">🎱</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-pulse">🎫</div>
        <div className="absolute top-40 right-20 text-4xl opacity-20 animate-spin" style={{animationDuration: '10s'}}>⭐</div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Why Choose Tambola?
            </h2>
            <p className="text-xl text-gray-600">Everything you need for a perfect Tambola experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all border border-purple-100"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-r from-rose-100 via-blue-50 to-purple-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Get started in just 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/auth"
              className="inline-block px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
            >
              Create Your First Game 🎮
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-500 to-blue-600 bg-clip-text text-transparent">
              Loved by Players
            </h2>
            <p className="text-xl text-gray-600">See what our community has to say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-rose-50 via-white to-purple-50 p-8 rounded-2xl shadow-lg border border-purple-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg italic">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-rose-400 via-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Host Your Tambola Game?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of happy hosts and players today!
          </p>
          <Link
            to="/auth"
            className="inline-block px-10 py-4 bg-white text-purple-600 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
          >
            Start Playing Now - It&apos;s Free! 🎯
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">🎯</span>
                <span className="text-2xl font-bold">Tambola</span>
              </div>
              <p className="text-gray-400">The classic Indian Housie game, now online!</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth" className="hover:text-white transition-colors">Play Now</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Hosts</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth" className="hover:text-white transition-colors">Create Room</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Manage Games</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 Tambola. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
