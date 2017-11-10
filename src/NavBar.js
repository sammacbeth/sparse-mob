import React, { Component } from 'react';
import { NavLink } from 'react-router-dom'

export default class NavBar extends Component {
  render() {
    const breadcrumbs = this.props.breadcrumbs;
    const breadComponents = breadcrumbs.map(({ link, name }) => (
      <NavLink className='breadcrumb-item' to={link} key={link}>{name}</NavLink>
    ));
    breadComponents.unshift((<NavLink className='breadcrumb-item' aria-current="page" to="/" key='/'>Rooms</NavLink>))
    return (
      <nav aria-label="breadcrumb" className='sticky-top'>
        <ol className="breadcrumb">
          {breadComponents}
        </ol>
      </nav>
    )
  }
}
