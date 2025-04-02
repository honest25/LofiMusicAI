import { Zap, Clock, Settings, Sparkles, CloudRain, Music, Disc3, HeadphonesIcon, Download, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function InfoSection() {
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="mt-auto pt-16">
      {/* Creative wavy separator */}
      <div className="relative w-full h-24 mb-16 overflow-hidden">
        <div className="absolute inset-0 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full min-w-[1440px] h-full absolute">
            <path 
              fill="rgba(139, 92, 246, 0.12)" 
              fillOpacity="1" 
              d="M0,160L60,165.3C120,171,240,181,360,186.7C480,192,600,192,720,176C840,160,960,128,1080,112C1200,96,1320,96,1380,96L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z">
            </path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full min-w-[1440px] h-full absolute" style={{top: '10px'}}>
            <path 
              fill="rgba(91, 33, 182, 0.1)" 
              fillOpacity="1" 
              d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,64C840,75,960,117,1080,133.3C1200,149,1320,139,1380,133.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z">
            </path>
          </svg>
        </div>
      </div>

      <div className="glass-card rounded-xl p-10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]"></div>
        
        {/* Vinyl record decoration */}
        <div className="absolute -right-20 top-40 opacity-5">
          <div className="w-40 h-40 rounded-full border-8 border-gray-300">
            <div className="w-full h-full rounded-full border-2 border-gray-300 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
        
        <motion.h2 
          className="text-3xl md:text-4xl font-bold mb-10 text-center text-gradient relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block mr-2"><Sparkles className="inline-block h-7 w-7 text-yellow-400" /></span>
          Hollywood-Grade Lo-Fi Transformation
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="h-7 w-7 text-white" />,
              title: "Powered by AI",
              description: "Our advanced AI algorithms analyze your music and apply authentic lo-fi transformations while preserving the original feel.",
              color: "from-purple-600 to-purple-400",
              bgGlow: "bg-purple-600/10",
              decorator: <Music className="h-16 w-16 text-white opacity-5 absolute -bottom-4 -right-4" />
            },
            {
              icon: <Clock className="h-7 w-7 text-white" />,
              title: "Fast Processing",
              description: "Get your lo-fi tracks in minutes, not hours. Our optimized conversion process delivers high-quality results quickly.",
              color: "from-blue-600 to-blue-400",
              bgGlow: "bg-blue-600/10",
              decorator: <HeadphonesIcon className="h-16 w-16 text-white opacity-5 absolute -bottom-4 -right-4" />
            },
            {
              icon: <Settings className="h-7 w-7 text-white" />,
              title: "Customizable",
              description: "Fine-tune your lo-fi sound with adjustable effects like vinyl crackle, reverb, and beat adjustments to create your perfect vibe.",
              color: "from-pink-600 to-pink-400",
              bgGlow: "bg-pink-600/10",
              decorator: <Disc3 className="h-16 w-16 text-white opacity-5 absolute -bottom-4 -right-4" />
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              custom={i}
              variants={featureVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="group glass-card rounded-xl p-6 border border-white/5 hover-lift relative overflow-hidden"
            >
              <div className={`absolute inset-0 ${feature.bgGlow} opacity-30 blur-xl transform group-hover:scale-110 transition-transform duration-700`}></div>
              
              {/* Icon with gradient background */}
              <div className="relative mb-5">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4 transform transition-transform group-hover:scale-110 duration-500`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold">{feature.title}</h4>
              </div>
              <p className="text-gray-300 relative z-10">{feature.description}</p>
              
              {/* Decorator icon */}
              <div className="absolute overflow-hidden right-0 bottom-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20">
                {feature.decorator}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Additional cinematic features section */}
        <div className="mt-12">
          <motion.h3 
            className="text-2xl font-bold mb-6 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Cinematic Lo-Fi Presets
          </motion.h3>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {[
              { name: "Rainy Night", icon: <CloudRain className="h-5 w-5 text-blue-400" /> },
              { name: "Vinyl Studio", icon: <Disc3 className="h-5 w-5 text-purple-400" /> },
              { name: "Tokyo Neon", icon: <Sparkles className="h-5 w-5 text-pink-400" /> },
              { name: "Sunset Drive", icon: <Music className="h-5 w-5 text-orange-400" /> }
            ].map((preset, i) => (
              <div 
                key={i} 
                className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-lg p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  {preset.icon}
                </div>
                <span className="font-medium">{preset.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Call to action */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xl text-gradient font-bold mb-3">Ready to transform your music?</p>
          <p className="text-gray-300 mb-6">Upload your first track and experience the Lo-Fi magic.</p>
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-full text-white font-medium shadow-lg hover:shadow-purple-500/20 transition-shadow flex items-center gap-2 mx-auto">
            <Upload className="h-5 w-5" />
            Get Started Now
          </button>
        </motion.div>
      </div>
    </div>
  );
}
