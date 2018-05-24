import LeftPanel from './LeftPanel';
import MainView from './MainView';
import React from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';

@inject('commonStore')
@inject('deepdetectStore')
@withRouter
@observer
export default class Service extends React.Component {
  componentWillReceiveProps(nextProps) {
    const serviceName = nextProps.match.params.serviceName;
    this.props.deepdetectStore.setCurrentService(serviceName);
  }

  render() {
    return (
      <div className="layout-page page-gutter page-with-contextual-sidebar right-sidebar-collapsed page-with-icon-sidebar">

        <LeftPanel />
        <MainView />

    </div>
    );
  }
}
