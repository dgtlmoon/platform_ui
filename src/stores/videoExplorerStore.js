import { observable, action, computed } from "mobx";
import agent from "../agent";
import path from "path";
import { nanoid } from 'nanoid';

export class videoExplorerStore {
    @observable loaded = false;
    @observable settings = {};

    @observable videoPaths = [];
    @observable frames = [];

    @action
    setup(configStore) {
        this.settings = configStore.videoExplorer;
    }

    @action
    toggleBoundingBoxes() {
        this.settings.boundingBoxes = !this.settings.boundingBoxes;
    }

    async refresh() {

        if(
            !this.settings ||
                !this.settings.rootPath
          )
            return null;

        await this.loadVideoPaths(this.outputFolderPath)
        this.loaded = true;
    }

    $reqFolder(rootPath) {
        return agent.Webserver.listFolders(rootPath);
    }

    $reqFiles(videoPath) {
    }

    @computed
    get outputFolderPath() {
        return path.join(this.settings.rootPath, this.settings.folders.output)
    }

    @computed
    get videoSrc() {
        return this.selectedVideo ?
            `${this.selectedVideo.path}${this.videoType}` : ""
    }

    @computed
    get videoPoster() {
        return "";
    }

    @computed
    get videoType() {
        return this.settings && this.settings.boundingBoxes ?
            "output_bbox.mp4" : "output.mp4"
    }

    @computed
    get selectedVideo() {
        return this.videoPaths.find(v => v.isSelected)
    }

    @computed
    get selectedFrame() {

        if(!this.frames || this.frames.length === 0)
            return null;
               
        return this.frames.find(f => f && f.isSelected)
    }

    @action
    setVideoPath(videoName) {
        this.videoPaths.forEach(v => v.isSelected = false)
        this.videoPaths.find(v => v.name === videoName).isSelected = true

        this.loadSelectedFrames()
    }

    @action
    setFrame(frameId) {
        this.frames.forEach(f => f.isSelected = false)
        this.frames.find(f => f.id === frameId).isSelected = true
    }

    @action
    async loadSelectedFrames() {

        const thumbFolder = this.settings.folders.thumbs;

        const videoPath = this.selectedVideo.path;
        const videoFiles = await agent.Webserver.listFiles(videoPath);

        const statsPath = path.join(videoPath, "stats.json");
        const stats = await agent.Webserver.getFile(statsPath);

        this.frames = videoFiles
            .filter(jsonFile => /^frame.*\.json$/.test(jsonFile))
            .map(jsonFile => {

                let frame = null;

                const regexpFrame = /frame(\d+)\.json/;
                const match = jsonFile.match(regexpFrame);

                if(match) {

                    const frameIndex = match[1]

                    const frameStat = stats.find(s => {
                        const regexpStatFname = new RegExp(`.*/frame${frameIndex}.png$`)
                        return s.fname.match(regexpStatFname)
                    })

                    frame = {
                        id: nanoid(),
                        isSelected: false,
                        index: parseInt(frameIndex),
                        jsonFile: jsonFile,
                        imageSrc: {
                            'original': `${videoPath}frame${frameIndex}.png`,
                            'thumb': `${videoPath}${thumbFolder}frame${frameIndex}.png`,
                        },
                        imageAlt: `Image ${parseInt(frameIndex)}`,
                        stats: frameStat
                    }
                }

                return frame;
            });

        if(this.frames.length > 0) {
            this.frames[0].isSelected = true;
        }
    }

    @action
    async loadVideoPaths(rootPath) {
        new Promise(resolve => {

            this.$reqFolder(rootPath)
                .then(async content => {
                    const { folders } = content;

                    const filteredFolders = folders.filter(f => {
                        let keepFolder = true;

                        if (this.settings.filter) {
                            if (this.settings.filter.exclude) {
                                keepFolder = this.settings.filter.exclude.every(
                                    e => f.href.indexOf(e) === -1
                                );
                            }
                        }

                        //
                        // Uncomment following section if you need to debug filter
                        //
                        // if (!keepFolder)
                        //   console.log(
                        //     "dataRepositoriesStore - load - folder filtered out: " +
                        //       rootPath +
                        //       " - " +
                        //       f.href
                        //   );

                        return keepFolder;
                    });

                    for (const folder of filteredFolders) {
                        const fPath = path.join(rootPath, folder.href, "/");
                        const fLabel = fPath.replace(new RegExp(this.settings.nginxPath, "gm"), "");

                        this.videoPaths.push({
                            id: nanoid(),
                            name: folder.name,
                            path: fPath,
                            label: fLabel,
                            frames: []
                        });
                    }
                })
                .catch(e => {
                    //console.log(e);
                });
        });
    }
}

export default new videoExplorerStore();
