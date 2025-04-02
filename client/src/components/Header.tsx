import { Music, Disc3, Headphones, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <header className="mb-12">
      <div className="flex items-center justify-between mb-8 relative">
        {/* Animated background glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/30 rounded-full blur-[100px] opacity-50"></div>
        
        <div className="flex items-center relative z-10">
          <motion.div 
            className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mr-3 neon-pulse"
            initial={{ rotate: -10 }}
            animate={{ rotate: 5 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2
            }}
          >
            <Disc3 className="h-7 w-7 text-white record-spin" />
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gradient tracking-tight">LoFify</h1>
            <p className="text-xs text-gray-400 mt-1">Studio Quality Lo-Fi Transformation</p>
          </div>
        </div>
        <div className="relative z-10">
          <button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-5 py-2.5 rounded-lg transition-all shadow-lg hover-lift">
            <span className="flex items-center">
              <Headphones className="h-4 w-4 mr-2" />
              Sign In
            </span>
          </button>
        </div>
      </div>
      
      <div className="text-center max-w-3xl mx-auto relative">
        {/* Decorative elements */}
        <div className="absolute -top-10 right-10 opacity-20">
          <Moon className="h-16 w-16 text-secondary" />
        </div>
        <div className="absolute -bottom-12 left-0 opacity-10">
          <Music className="h-24 w-24 text-primary" />
        </div>
        
        <motion.h2 
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-gradient"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Transform Your Music into <br/> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Cinematic Lo-Fi
          </span>
        </motion.h2>
        
        <motion.p 
          className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Upload your tracks and watch them transform into professional quality lo-fi beats with 
          our advanced audio engine and customizable Hollywood-grade effects.
        </motion.p>
        
        {/* Visual feature highlights */}
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {["Studio Quality", "Instant Processing", "Customizable Effects", "Download & Share"].map((feature, i) => (
            <motion.div 
              key={i}
              className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.6 }}
            >
              <span className="text-sm font-medium">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </header>
  );
}
