import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../Settings/hooks/useTheme';
import { ThemeToggle } from '../Settings/components/ThemeToggle';
import {
  TrendingUpIcon,
  ShieldCheckIcon,
  BoltIcon,
  CpuChipIcon,
  ChartBarIcon,
  LockClosedIcon,
  ArrowRightIcon,
  PlayIcon,
  CheckCircleIcon,
  StarIcon,
  GlobeAltIcon,
  UserGroupIcon,
} from './icons';
import './LandingPage.css';
import './enhanced-animations.css';
import './particles-animations.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, resolvedTheme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  
  // Advanced animation values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const featuresY = useTransform(scrollY, [300, 800], [50, -50]);
  const statsY = useTransform(scrollY, [500, 1000], [100, -100]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePosition({ x: clientX, y: clientY });
      mouseX.set(clientX - window.innerWidth / 2);
      mouseY.set(clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'analytics', 'security', 'testimonials'];
      const scrollPosition = window.scrollY + 200;
      
      // Update navbar scroll state
      setIsScrolled(window.scrollY > 50);

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && scrollPosition >= element.offsetTop) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.7, 
        ease: "easeOut",
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      rotateX: 5,
      rotateY: 5,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Enhanced magnetic effect variants
  const magneticVariants = {
    default: { x: 0, y: 0 },
    hover: {
      x: mouseXSpring,
      y: mouseYSpring,
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  // Stagger animations for grids
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  // Advanced text reveal animation
  const textReveal = {
    hidden: { 
      opacity: 0,
      y: 100,
      clipPath: "inset(0 0 100% 0)"
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0 0% 0)",
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const features = [
    {
      icon: CpuChipIcon,
      title: "AI-Powered Risk Assessment",
      description: "98.4% accuracy machine learning model with Ghana-specific employment analysis",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: ShieldCheckIcon,
      title: "Enterprise Security",
      description: "Multi-factor authentication, RBAC, and behavioral biometrics protection",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BoltIcon,
      title: "Real-Time Processing",
      description: "Instant credit decisions with live notifications and WebSocket integration",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: ChartBarIcon,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards with predictive analytics and custom reporting",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: LockClosedIcon,
      title: "Regulatory Compliance",
      description: "Built-in compliance with banking regulations and data protection standards",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: GlobeAltIcon,
      title: "Ghana Localization",
      description: "Specialized for Ghana's financial market with local employment categories",
      color: "from-red-500 to-pink-500"
    }
  ];

  const stats = [
    { value: "98.4%", label: "ML Model Accuracy", icon: TrendingUpIcon },
    { value: "<100ms", label: "Processing Time", icon: BoltIcon },
    { value: "500+", label: "Concurrent Users", icon: UserGroupIcon },
    { value: "99.9%", label: "System Uptime", icon: CheckCircleIcon }
  ];

  const testimonials = [
    {
      name: "Dr. Akosua Mensah",
      role: "Chief Risk Officer",
      company: "Ghana Commercial Bank",
      message: "RiskGuard has revolutionized our credit assessment process. The 98.4% AI accuracy and Ghana-specific employment analysis provide unprecedented insights into our local market.",
      rating: 5,
      image: "/images/akosuah.png"
    },
    {
      name: "Kwame Osei-Bonsu",
      role: "Head of Digital Banking",
      company: "Ecobank Ghana",
      message: "The real-time processing capabilities and enterprise-grade security features have enabled us to serve more customers while maintaining the highest compliance standards.",
      rating: 5,
      image: "/images/kwame.png"
    },
    {
      name: "Jennifer Appiah",
      role: "Senior Credit Analyst",
      company: "Fidelity Bank Ghana",
      message: "The behavioral biometrics and multi-factor authentication provide an additional layer of security that gives our customers confidence in digital banking.",
      rating: 5,
      image: "/images/jennifer.png"
    },
    {
      name: "Emmanuel Nkrumah",
      role: "Head of Risk Management",
      company: "Standard Chartered Ghana",
      message: "RiskGuard's predictive analytics and custom reporting have streamlined our decision-making process, reducing processing time by 85%.",
      rating: 5,
      image: "/images/emmanuel.png"
    }
  ];

  return (
    <div className="landing-page">
      {/* Scroll Progress Indicator */}
      <motion.div
        className="scroll-progress"
        style={{ scaleX: scrollYProgress }}
      />
      
      <div className="main-content">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="floating-shapes">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`floating-shape shape-${i + 1}`}
              animate={{
                y: [-20, 20],
                x: [-10, 10],
                rotate: [0, 360]
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Mouse follower effect */}
        {/* Animated particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`particle particle-${i + 1}`}
            animate={{
              y: [-30, 30],
              x: [-15, 15],
              opacity: [0.3, 0.8],
              scale: [0.8, 1.2]
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
          />
        ))}
        
        {/* Morphing background shapes */}
        <motion.div
          className="morphing-shape morphing-shape-1"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="morphing-shape morphing-shape-2"
          animate={{
            rotate: [360, 0],
            scale: [0.8, 1.1, 0.9, 0.8]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        <motion.div
          className="morphing-shape morphing-shape-3"
          animate={{
            rotate: [0, -360],
            scale: [1.1, 0.9, 1.3, 1.1]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />
        
        {/* Enhanced mouse followers with multiple layers */}
        <motion.div
          className="mouse-follower primary"
          style={{
            x: mouseXSpring,
            y: mouseYSpring
          }}
        />
        <motion.div
          className="mouse-follower secondary"
          style={{
            x: useTransform(mouseXSpring, (x) => x * 0.5),
            y: useTransform(mouseYSpring, (y) => y * 0.5)
          }}
        />
        <motion.div
          className="mouse-follower tertiary"
          style={{
            x: useTransform(mouseXSpring, (x) => x * 0.2),
            y: useTransform(mouseYSpring, (y) => y * 0.2)
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className={`navbar ${isScrolled ? 'scrolled' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="nav-container">
          <motion.div 
            className="nav-logo"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img src="/creditrisklogo.png" alt="RiskGuard" className="logo-img" />
            <span className="logo-text">RiskGuard</span>
          </motion.div>
          
          <div className="nav-menu">
            <motion.a 
              href="#features" 
              className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
              whileHover={{ color: "#667eea" }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#analytics" 
              className={`nav-link ${activeSection === 'analytics' ? 'active' : ''}`}
              whileHover={{ color: "#667eea" }}
            >
              Analytics
            </motion.a>
            <motion.a 
              href="#security" 
              className={`nav-link ${activeSection === 'security' ? 'active' : ''}`}
              whileHover={{ color: "#667eea" }}
            >
              Security
            </motion.a>
            <motion.a 
              href="#testimonials" 
              className={`nav-link ${activeSection === 'testimonials' ? 'active' : ''}`}
              whileHover={{ color: "#667eea" }}
            >
              Testimonials
            </motion.a>
            <motion.button
              className="nav-login-btn"
              onClick={() => navigate('/auth')}
              whileHover={{ scale: 1.05, backgroundColor: "#1e40af" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              Login
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        id="hero"
        className="hero-section"
        style={{ y: heroY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="hero-container">
          <motion.div className="hero-content" variants={itemVariants}>
            {/* <motion.div
              className="hero-badge"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StarIcon className="badge-icon" />
              Enterprise Grade • 98.4% ML Accuracy
            </motion.div> */}
            
            <motion.h1 
              className="hero-title overflow-hidden"
              variants={textReveal}
              initial="hidden"
              animate="visible"
            >
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { y: "100%" },
                  visible: { y: "0%", transition: { duration: 0.8, delay: 0.2 } }
                }}
              >
                Next-Generation{" "}
              </motion.span>
              <motion.span 
                className="text-gradient inline-block"
                variants={{
                  hidden: { y: "100%" },
                  visible: { y: "0%", transition: { duration: 0.8, delay: 0.4 } }
                }}
              >
                Credit Risk
              </motion.span>{" "}
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { y: "100%" },
                  visible: { y: "0%", transition: { duration: 0.8, delay: 0.6 } }
                }}
              >
                Management Platform
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="hero-description"
              variants={itemVariants}
            >
              Powered by advanced AI and built for Ghana's financial market. 
              RiskGuard delivers intelligent credit assessments with enterprise-grade 
              security and real-time processing capabilities.
            </motion.p>

            <motion.div 
              className="hero-actions"
              variants={itemVariants}
            >
              <motion.button
                className="primary-btn"
                onClick={() => navigate('/auth')}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Get Started
                <ArrowRightIcon className="btn-icon" />
              </motion.button>
              
              <motion.button
                className="secondary-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <PlayIcon className="btn-icon" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats Row */}
            <motion.div 
              className="hero-stats"
              variants={itemVariants}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-item group cursor-pointer"
                  variants={cardVariants}
                  whileHover="hover"
                  onHoverStart={() => {
                    mouseX.set((index - 2) * 50);
                    mouseY.set(-25);
                  }}
                  onHoverEnd={() => {
                    mouseX.set(0);
                    mouseY.set(0);
                  }}
                >
                  <stat.icon className="stat-icon" />
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            className="hero-visual"
            variants={itemVariants}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="hero-image-container">
              <motion.img
                src="/images/fintech-hero.png"
                alt="AI-Powered Credit Risk Management"
                className="hero-main-image"
                animate={{ 
                  y: [-10, 10],
                  rotateX: [0, 5],
                  rotateY: [0, -2]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  type: "spring",
                  damping: 20
                }}
                whileHover={{
                  scale: 1.05,
                  rotateX: 10,
                  rotateY: 10,
                  transition: { duration: 0.3 }
                }}
              />
              <div className="dashboard-preview">
                <motion.div
                  className="preview-screen"
                  animate={{ y: [-10, 10] }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                >
                  <div className="screen-header">
                    <div className="screen-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <span className="screen-title">RiskGuard Dashboard</span>
                  </div>
                  <div className="screen-content">
                    <div className="metric-cards">
                      <div className="metric-card">
                        <div className="metric-value">742</div>
                        <div className="metric-label">Credit Score</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value">96.8%</div>
                        <div className="metric-label">Confidence</div>
                      </div>
                    </div>
                    <div className="chart-placeholder">
                      <motion.div
                        className="chart-bar"
                        initial={{ height: 0 }}
                        animate={{ height: "60%" }}
                        transition={{ duration: 2, delay: 1 }}
                      />
                      <motion.div
                        className="chart-bar"
                        initial={{ height: 0 }}
                        animate={{ height: "80%" }}
                        transition={{ duration: 2, delay: 1.2 }}
                      />
                      <motion.div
                        className="chart-bar"
                        initial={{ height: 0 }}
                        animate={{ height: "45%" }}
                        transition={{ duration: 2, delay: 1.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features"
        className="features-section"
        style={{ y: featuresY }}
      >
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="section-title">
              Powerful Features for{" "}
              <span className="text-gradient">Modern Banking</span>
            </h2>
            <p className="section-description">
              Built with cutting-edge technology to deliver unparalleled credit risk management
            </p>
          </motion.div>

          <motion.div
            className="features-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card group cursor-pointer perspective-1000"
                variants={cardVariants}
                whileHover="hover"
                onHoverStart={() => {
                  mouseX.set((index % 2 === 0 ? -1 : 1) * 20);
                  mouseY.set(-10);
                }}
                onHoverEnd={() => {
                  mouseX.set(0);
                  mouseY.set(0);
                }}
              >
                <motion.div 
                  className={`feature-icon bg-gradient-to-r ${feature.color} relative overflow-hidden`}
                  whileHover={{
                    scale: 1.1,
                    rotateX: 15,
                    rotateY: 15,
                    transition: { duration: 0.3 }
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                    initial={false}
                    whileHover={{
                      opacity: 0.2,
                      backgroundPosition: ["0% 0%", "100% 100%"],
                      transition: { duration: 0.6 }
                    }}
                  />
                  <feature.icon className="icon relative z-10" />
                </motion.div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <motion.div
                  className="feature-link group-hover:text-white transition-colors"
                  whileHover={{ x: 8 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Learn more 
                  <motion.div
                    className="inline-block"
                    whileHover={{ x: 4, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ArrowRightIcon className="link-icon" />
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Analytics Section */}
      <motion.section 
        id="analytics"
        className="analytics-section"
        style={{ y: statsY }}
      >
        <div className="section-container">
          <div className="analytics-content">
            <motion.div
              className="analytics-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="section-title">
                Advanced Analytics &{" "}
                <span className="text-gradient">Business Intelligence</span>
              </h2>
              <p className="section-description">
                Make data-driven decisions with real-time insights and predictive analytics
              </p>
              
              <div className="feature-list">
                {[
                  "Real-time dashboard with live KPIs",
                  "Predictive risk modeling",
                  "Ghana-specific market insights",
                  "Custom report generation",
                  "Trend analysis and forecasting"
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="feature-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <CheckCircleIcon className="check-icon" />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="cta-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
              >
                Explore Analytics
              </motion.button>
            </motion.div>

            <motion.div
              className="analytics-visual"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="analytics-image-container">
                <motion.img
                  src="/images/analytics-db.png"
                  alt="Advanced Analytics Dashboard"
                  className="analytics-image"
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                />
                <div className="analytics-dashboard">
                  <div className="dashboard-grid">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="dashboard-widget group cursor-pointer"
                        initial={{ scale: 0, opacity: 0, rotateX: 45 }}
                        whileInView={{ 
                          scale: 1, 
                          opacity: 1, 
                          rotateX: 0,
                          transition: {
                            duration: 0.6,
                            delay: i * 0.1,
                            type: "spring",
                            stiffness: 200,
                            damping: 20
                          }
                        }}
                        viewport={{ once: true }}
                        whileHover={{ 
                          scale: 1.05,
                          y: -5,
                          rotateX: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className="widget-content">
                          <div className="widget-value">
                            {['98.4%', '₵2.4M', '1,247', '67.8%', '<100ms', '99.9%'][i]}
                          </div>
                          <div className="widget-label">
                            {['Accuracy', 'Processed', 'Applications', 'Approval Rate', 'Speed', 'Uptime'][i]}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Security Feature Section */}
      <motion.section id="security" className="security-showcase">
        <div className="section-container">
          <motion.div className="security-content">
            <motion.div
              className="security-image"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img src="/images/security-shield.png" alt="Enterprise Security" />
            </motion.div>
            <motion.div
              className="security-info"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="security-title">
                Bank-Grade <span className="text-gradient">Security</span>
              </h3>
              <p className="security-description">
                Multi-layered security architecture with behavioral biometrics, 
                real-time fraud detection, and enterprise-grade encryption protecting 
                millions of transactions across Ghana's financial ecosystem.
              </p>
              <div className="security-features">
                {[
                  "Multi-Factor Authentication",
                  "Behavioral Biometrics",
                  "End-to-End Encryption",
                  "Real-time Fraud Detection"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="security-feature"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <ShieldCheckIcon className="feature-check" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="section-title">
              Trusted by{" "}
              <span className="text-gradient">Leading Financial Institutions</span>
            </h2>
          </motion.div>

          <motion.div
            className="testimonials-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="testimonial-card enhanced group cursor-pointer"
                variants={cardVariants}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  rotateX: 2,
                  rotateY: 2,
                  transition: { duration: 0.3, type: "spring", stiffness: 300 }
                }}
                onHoverStart={() => {
                  mouseX.set((index % 2 === 0 ? -1 : 1) * 15);
                  mouseY.set(-8);
                }}
                onHoverEnd={() => {
                  mouseX.set(0);
                  mouseY.set(0);
                }}
              >
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="star-icon" />
                  ))}
                </div>
                <p className="testimonial-message">"{testimonial.message}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="avatar-image"
                    />
                  </div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">
                      {testimonial.role}
                    </div>
                    <div className="author-company">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section className="cta-section">
        <div className="section-container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="cta-title">
              Ready to Transform Your{" "}
              <span className="text-gradient">Credit Risk Management?</span>
            </h2>
            <p className="cta-description">
              Join leading financial institutions using RiskGuard for intelligent, 
              secure, and efficient credit assessments.
            </p>
            
            <motion.div
              className="cta-actions"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.button
                className="primary-btn large group overflow-hidden relative"
                onClick={() => navigate('/auth')}
                variants={magneticVariants}
                initial="default"
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => {
                  mouseX.set(0);
                  mouseY.set(-5);
                }}
                onHoverEnd={() => {
                  mouseX.set(0);
                  mouseY.set(0);
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100"
                  initial={false}
                  whileHover={{
                    opacity: 1,
                    scale: [1, 1.2, 1],
                    transition: { duration: 0.6 }
                  }}
                />
                <span className="relative z-10">Start Your Journey</span>
                <motion.div
                  className="relative z-10"
                  whileHover={{ x: 4, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowRightIcon className="btn-icon" />
                </motion.div>
              </motion.button>
              
              <motion.button
                className="outline-btn large group relative overflow-hidden"
                variants={magneticVariants}
                initial="default"
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => {
                  mouseX.set(0);
                  mouseY.set(-3);
                }}
                onHoverEnd={() => {
                  mouseX.set(0);
                  mouseY.set(0);
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10"
                  whileHover={{
                    opacity: 0.1,
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.4 }
                  }}
                />
                <span className="relative z-10">Schedule Demo</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Industry Innovation Section */}
      <motion.section className="innovation-section">
        <div className="section-container">
          <motion.div className="innovation-content">
            <motion.div
              className="innovation-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="innovation-title">
                Pioneering <span className="text-gradient">Financial Innovation</span> in Ghana
              </h3>
              <p className="innovation-description">
                Built specifically for Ghana's banking sector, RiskGuard combines 
                international best practices with deep local market understanding.
              </p>
              <div className="innovation-stats">
                {[
                  { value: "500K+", label: "Credit Applications Processed" },
                  { value: "50+", label: "Financial Institutions" },
                  { value: "₵2.5B", label: "Total Credit Assessed" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="innovation-stat"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="innovation-image"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img src="/images/banking-innovation.png" alt="Banking Innovation" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Footer */}
      <motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/creditrisklogo.png" alt="RiskGuard" />
                <span>RiskGuard</span>
              </div>
              <p className="footer-description">
                Enterprise-grade credit risk management platform powered by AI
              </p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#analytics">Analytics</a>
                <a href="#security">Security</a>
              </div>
              
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#careers">Careers</a>
              </div>
              
              <div className="footer-column">
                <h4>Resources</h4>
                <a href="#documentation">Documentation</a>
                <a href="#support">Support</a>
                <a href="#api">API</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 RiskGuard. All rights reserved.</p>
            <div className="footer-badges">
              <span className="badge">Enterprise Ready</span>
              <span className="badge">Ghana Specialized</span>
              <span className="badge">AI Powered</span>
            </div>
          </div>
        </div>
      </motion.footer>
      </div>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
};

export default LandingPage;