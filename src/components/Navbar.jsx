import React, { useState } from 'react'
import {Link} from 'react-scroll'
import './navbar.css'

const Navbar = () => {
     

 
  return (
    <div className='navbar'>
      <div className='navbarMenu'>
            <Link activeClass='active' to='home' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>Home</Link>
            <Link activeClass='active' to='pos' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>POS</Link>
            <Link activeClass='active' to='order' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>Orders</Link>
            <Link activeClass='active' to='sale' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>Sales</Link>
            <Link activeClass='active' to='products' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>Products</Link>
            <Link activeClass='active' to='stock' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>Stocks</Link>
            <Link activeClass='active' to='account' spy={true} smooth={true} offset={-100} duration={500} className='navbarMenuItem'>Account</Link>
      </div>
      
    </div>
  )
}

export default Navbar
