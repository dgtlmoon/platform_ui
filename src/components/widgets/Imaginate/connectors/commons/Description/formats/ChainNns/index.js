import React from "react";
import PropTypes from "prop-types";
import { inject, observer } from "mobx-react";

import ParamSlider from "../../../ParamSlider";
import ToggleControl from "../../../ToggleControl";

@inject("imaginateStore")
@observer
export default class ChainNns extends React.Component {
  constructor(props) {
    super(props);

    this.handleMulticropToggle = this.handleMulticropToggle.bind(this);
    this.handleSearchNnThreshold = this.handleSearchNnThreshold.bind(this);
    this.handleMinSizeRatioThreshold = this.handleMinSizeRatioThreshold.bind(
      this
    );

    this.minSizeRatioTooltipFormatter = this.minSizeRatioTooltipFormatter.bind(
      this
    );

    this.nnsItem = this.nnsItem.bind(this);
  }

  minSizeRatioTooltipFormatter(value) {
    return (value / 100).toFixed(2);
  }

  handleMulticropToggle() {
    const { service, settings } = this.props.imaginateStore;
    settings.default.display.chain.multicrop = !settings.default.display.chain
      .multicrop;

    if (!settings.default.display.chain.multicrop && service.uiParams.chain) {
      delete service.uiParams.chain.min_size_ratio;
    }
  }

  handleSearchNnThreshold(value) {
    const { service, settings } = this.props.imaginateStore;
    settings.default.display.chain.search_nn = parseInt(value, 10);

    if (!service.uiParams.chain) {
      service.uiParams.chain = {};
    }
    service.uiParams.chain.search_nn = settings.default.display.chain.search_nn;

    this.props.imaginateStore.predict();
  }

  handleMinSizeRatioThreshold(value) {
    const { service, settings } = this.props.imaginateStore;
    settings.default.display.chain.min_size_ratio = parseFloat(
      (value / 100).toFixed(2)
    );
    if (settings.default.display.chain.min_size_ratio === 0) {
      settings.default.display.chain.min_size_ratio = 0.01;
    }

    if (!service.uiParams.chain) {
      service.uiParams.chain = {};
    }
    service.uiParams.chain.min_size_ratio =
      settings.default.display.chain.min_size_ratio;

    this.props.imaginateStore.predict();
  }

  nnsItem(nns, index) {
    const percent = parseInt(nns.dist * 100, 10);
    const progressStyle = { width: `${percent}%` };

    let progressBg = "bg-danger";

    if (percent < 60) {
      progressBg = "bg-warning";
    }

    if (percent < 30) {
      progressBg = "bg-success";
    }

    return (
      <div key={index} className="col progress-nns">
        <img src={nns.uri} className="img-fluid" alt="" />
        <div
          className={`progress-bar ${progressBg}`}
          role="progressbar"
          style={progressStyle}
          aria-valuenow={percent}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {percent}
        </div>
      </div>
    );
  }

  render() {
    const { input, selectedBoxIndex, imaginateStore } = this.props;
    let uiControls = [];

    const {
      multicrop,
      search_nn,
      min_size_ratio
    } = imaginateStore.settings.default.display.chain;

    uiControls.push(
      <ParamSlider
        key="paramSliderSearchNn"
        title="Search Size"
        defaultValue={search_nn}
        onAfterChange={this.handleSearchNnThreshold}
        min={0}
        max={100}
      />
    );

    uiControls.push(
      <ToggleControl
        key="settingCheckbox-display-unsupervised-search"
        title="Multicrop"
        value={multicrop}
        onChange={this.handleMulticropToggle}
      />
    );

    if (multicrop) {
      uiControls.push(
        <ParamSlider
          key="paramSliderMinSizeRatio"
          title="Min Size Ratio"
          defaultValue={parseInt(min_size_ratio * 100, 10)}
          onAfterChange={this.handleMinSizeRatioThreshold}
          tipFormatter={this.minSizeRatioTooltipFormatter}
        />
      );

      let cells = input.json.body.predictions[0].nns
        .map(this.nnsItem)
        .reduce((result, element, index, array) => {
          // Add 2-columns separators
          result.push(element);
          if ((index + 1) % 2 === 0) {
            result.push(<div key={`sep-${index}`} className="w-100" />);
          }
          return result;
        }, []);

      // Add empty column to fill row
      if (cells.length % 2 === 1)
        cells.push(<div key="empty-col" className="col" />);

      uiControls.push(
        <div
          key="description-chain-nns-selected"
          className="description-nns row"
        >
          {cells}
        </div>
      );
    } else if (selectedBoxIndex !== -1) {
      const selectedResult =
        input.json.body.predictions[0].classes[selectedBoxIndex];

      let chainService = null;
      for (let i = 0; i < Object.keys(selectedResult).length; i += 1) {
        const key = Object.keys(selectedResult)[i];
        const child = selectedResult[key];

        if (child.nns) {
          chainService = key;
          break;
        }
      }

      let cells = selectedResult[chainService].nns
        .map(this.nnsItem)
        .reduce((result, element, index, array) => {
          // Add 2-columns separators
          result.push(element);
          if ((index + 1) % 2 === 0) {
            result.push(<div key={`sep-${index}`} className="w-100" />);
          }
          return result;
        }, []);

      // Add empty column to fill row
      if (cells.length % 2 === 1)
        cells.push(<div key="empty-col" className="col" />);

      uiControls.push(
        <div
          key="description-chain-nns-selected"
          className="description-nns row"
        >
          {cells}
        </div>
      );
    }

    return <div>{uiControls}</div>;
  }
}

ChainNns.propTypes = {
  input: PropTypes.object.isRequired
};
