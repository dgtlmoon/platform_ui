import React from "react";
import { Link } from "react-router-dom";
import { inject, observer } from "mobx-react";

import ServerDropdown from "./dropdowns/ServerDropdown";
import UserDropdown from "./dropdowns/UserDropdown";
import AboutDropdown from "./dropdowns/AboutDropdown";

import PredictLink from "./links/Predict";
import TrainingLink from "./links/Training";

import VideoExplorerLink from "./links/VideoExplorer";

import JupyterLink from "./links/Jupyter";
import DataLink from "./links/Data";
import DocumentationLink from "./links/Documentation";
import ChatLink from "./links/Chat";
import MenusLink from "./links/Menus";

@inject("configStore")
@observer
class Header extends React.Component {
  render() {

    if (
      this.props.configStore.isComponentBlacklisted("Header")
    )
      return null;

    return (
      <header className="header navbar navbar-dark bg-dark" id="header">
        <div className="container-fluid">
          <div className="header-content">
            <div className="title-container">
              <h1 className="title">
                <Link to="/">
                  <img src="/logo.svg" alt="DeepDetect" />
                </Link>
              </h1>

              <ul className="list-unstyled navbar-sub-nav">
                <PredictLink />
                <TrainingLink />
                <VideoExplorerLink />
                <li>
                  <span className="separator">|</span>
                </li>
                <JupyterLink />
                <DataLink />
                <ChatLink />
                <MenusLink />
              </ul>
            </div>

            <div className="navbar-collapse d-flex justify-content-end">
              <ul className="nav nabar-nav">
                <ServerDropdown />
                <DocumentationLink />
                <AboutDropdown />
                <UserDropdown />
              </ul>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

export default Header;
