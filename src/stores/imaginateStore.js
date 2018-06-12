import { observable, action } from "mobx";
import agent from "../agent";

export class imaginateStore {
  @observable isLoaded = false;
  @observable isRequesting = false;
  @observable settings = {};

  @observable imgList = [];
  @observable selectedImageIndex = -1;
  @observable selectedImage = null;

  @observable curlParams = null;
  @observable confidence = null;

  @action
  setup(configStore) {
    this.settings = configStore.imaginate;

    const initImages = this.settings.display.initImages;

    // Init image list if available inside config.json
    if (typeof initImages !== "undefined") {
      switch (initImages.type) {
        case "urlList":
        default:
          const list = initImages.list;

          if (typeof list !== "undefined" && list.length > 0) {
            this.imgList = this.settings.display.initImages.list.map(img => {
              return {
                url: img,
                boxes: [[10, 10, 10, 10]],
                json: null
              };
            });
          }

          break;
      }
    }

    // If existing image, init the first selected one
    if (this.imgList.length > 0) this.selectedImageIndex = 0;

    this.confidence = this.settings.threshold.confidence;

    this.isLoaded = true;
  }

  @action
  setSelectedImage(index) {
    this.selectedImageIndex = index;
    this.selectedImage = null;
  }

  $reqPostPredict(deepdetectSettings, postData) {
    return agent.Deepdetect.postPredict(deepdetectSettings, postData);
  }

  @action
  initPredict(service) {
    if (this.imgList.length === 0) return null;

    const image = this.imgList[this.selectedImageIndex];

    if (typeof image === "undefined") return null;

    this.isRequesting = true;

    image.json = null;

    image.postData = {
      service: service.name,
      parameters: {
        output: {
          confidence_threshold: this.confidence
        }
      },
      data: [image.url]
    };

    if (typeof image.path !== "undefined") {
      image.postData.data = [image.path];
    }

    if (this.settings.display.boundingBox) {
      image.postData.parameters.output.bbox = true;
    }

    if (this.settings.request.best) {
      image.postData.parameters.output.best = parseInt(
        this.settings.request.best,
        10
      );
    }

    if (service.mltype === "ctc") {
      image.postData.parameters.output.ctc = true;
      image.postData.parameters.output.confidence_threshold = 0;
      image.postData.parameters.output.blank_label = 0;
      delete image.postData.parameters.output.bbox;
    }

    if (this.settings.request.blank_label) {
      image.postData.parameters.output.blank_label = parseInt(
        this.settings.request.blank_label,
        10
      );
    }

    if (service.mltype === "segmentation") {
      image.postData.parameters.input = { segmentation: true };
      image.postData.parameters.output = {};
    }

    if (this.settings.request.objSearch || this.settings.request.imgSearch) {
      image.postData.parameters.output.search = true;
    }

    if (this.settings.request.objSearch) {
      image.postData.parameters.output.rois = "rois";
    }

    this.curlParams = image.postData;
  }

  @action
  async predict(deepdetectSettings) {
    if (this.imgList.length === 0) return null;

    const image = this.imgList[this.selectedImageIndex];

    if (typeof image === "undefined") return null;

    image.json = await this.$reqPostPredict(deepdetectSettings, image.postData);

    if (typeof image.json.body === "undefined") {
      image.error = true;
    } else {
      const prediction = image.json.body.predictions[0];
      const classes = prediction.classes;

      if (typeof classes !== "undefined") {
        image.boxes = classes.map(predict => predict.bbox);
      }

      if (
        (this.settings.request.objSearch || this.settings.request.imgSearch) &&
        typeof image.json.body.predictions[0].rois !== "undefined"
      ) {
        image.boxes = prediction.rois.map(predict => predict.bbox);
      }

      image.pixelSegmentation =
        typeof prediction.vals === "undefined" ? [] : prediction.vals;
    }

    this.selectedImage = image;
    this.isRequesting = false;
  }

  @action
  setThreshold(thresholdValue) {
    this.confidence = thresholdValue;
  }

  @action
  addImageFromUrl(url) {
    this.imgList.push({
      url: url,
      json: null,
      boxes: null
    });
    this.setSelectedImage(this.imgList.length - 1);
  }

  $reqImgFromPath(path) {
    return agent.Webserver.listFiles(path);
  }

  @action
  async addImageFromPath(nginxPath, systemPath, folderName, callback) {
    const serverImages = await this.$reqImgFromPath(
      nginxPath + folderName + "/"
    );
    this.imgList = serverImages.map(i => {
      return {
        url: nginxPath + folderName + "/" + i,
        path: systemPath + folderName + "/" + i,
        json: null,
        boxes: null
      };
    });
    this.setSelectedImage(0);
    callback();
  }
}

export default new imaginateStore();
