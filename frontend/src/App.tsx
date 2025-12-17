import '@/styles/App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Statistics from './components/Statistics'
import Capabilities from './components/Capabilities'
import CaseStudies from './components/CaseStudies'
import Events from './components/Events'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'

function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <Statistics />
      <Capabilities />
      <CaseStudies />
      <Events />
      <Testimonials />
      <Footer />
    </div>
  )
}

export default App

