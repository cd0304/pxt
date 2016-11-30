import * as React from "react";
import * as pkg from "./package";
import * as core from "./core";
import * as srceditor from "./srceditor"
import * as sui from "./sui";
import * as codecard from "./codecard"

import Cloud = pxt.Cloud;
import Util = pxt.Util;

const lf = Util.lf

export class Editor extends srceditor.Editor {
    config: pxt.PackageConfig = {} as any;

    prepare() {
        this.isReady = true
    }

    getId() {
        return "pxtJsonEditor"
    }

    /*
                    <div className="three fields">
                        <sui.Input inputLabel={lf("Any") } type="number" value={(card.any || 0).toString() } onChange={v => {
                            initCard();
                            let vi = Math.max(0, parseInt(v) || 0)
                            update(c.card.any = vi)
                        } } />
                        <sui.Input inputLabel={lf("Hardware") } type="number" value={(card.hardware || 0).toString() } onChange={v => {
                            initCard();
                            let vi = Math.max(0, parseInt(v) || 0)
                            update(c.card.hardware = vi)
                        } } />
                        <sui.Input inputLabel={lf("Software") } type="number" value={(card.software || 0).toString() } onChange={v => {
                            initCard();
                            let vi = Math.max(0, parseInt(v) || 0)
                            update(c.card.software = vi)
                        } } />
                    </div>
*/

    display() {
        const c = this.config
        const update = (v: any) => {
            this.parent.forceUpdate()
            Util.nextTick(this.changeCallback)
        }
        const initCard = () => {
            if (!c.card) c.card = {}
        }
        const card = c.card || {};
        let userConfigs: pxt.CompilationConfig[] = [];
        pkg.allEditorPkgs().map(ep => ep.getKsPkg())
            .filter(dep => !!dep && dep.isLoaded && !!dep.config && !!dep.config.yotta && !!dep.config.yotta.userConfigs)
            .forEach(dep => userConfigs = userConfigs.concat(dep.config.yotta.userConfigs));

        const isUserConfigActive = (uc: pxt.CompilationConfig) => {
            const cfg = Util.jsonFlatten(this.config.yotta ? this.config.yotta.config : {});
            const ucfg = Util.jsonFlatten(uc.config);
            return !Object.keys(ucfg).some(k => cfg[k] !== ucfg[k]);
        }
        const applyUserConfig = (uc: pxt.CompilationConfig) => {
            const cfg = Util.jsonFlatten(this.config.yotta ? this.config.yotta.config : {});
            const ucfg = Util.jsonFlatten(uc.config);
            if (isUserConfigActive(uc)) {
                Object.keys(ucfg).forEach(k => delete cfg[k]);
            } else {
                Util.jsonMergeFrom(cfg, ucfg);
            }
            // update cfg
            if (Object.keys(cfg).length) {
                if (!this.config.yotta) this.config.yotta = {};
                Object.keys(cfg).filter(k => cfg[k] === null).forEach(k => delete cfg[k]);
                this.config.yotta.config = Util.jsonUnFlatten(cfg);
            } else {
                if (this.config.yotta) {
                    delete this.config.yotta.config;
                    if (!Object.keys(this.config.yotta).length)
                        delete this.config.yotta;
                }
            }
            // trigger update
            update(uc);
        }
        return (
            <div className="ui content">
                <div className="ui segment form text" style={{ backgroundColor: "white" }}>
                    {Cloud.isLoggedIn() ?
                        <sui.Field>
                            <div className="ui toggle checkbox ">
                                <input type="checkbox" name="public" checked={c.public}
                                    onChange={() => update(c.public = !c.public) } />
                                <label>{lf("Public package (library)") }</label>
                            </div>
                        </sui.Field> : ""}
                    <sui.Input label={lf("Description") } lines={3} value={c.description} onChange={v => update(c.description = v) } />
                    {userConfigs.map(uc =>
                        <sui.Checkbox
                            inputLabel={uc.description}
                            checked={isUserConfigActive(uc) }
                            onChange={() => applyUserConfig(uc) } />
                    ) }
                    <sui.Field>
                        <sui.Button text={lf("Edit Settings As text") } onClick={() => this.parent.editText() } />
                    </sui.Field>
                </div>
            </div>
        )
    }

    getCurrentSource() {
        return JSON.stringify(this.config, null, 4) + "\n"
    }

    acceptsFile(file: pkg.File) {
        if (file.name != pxt.CONFIG_NAME) return false

        if (file.isReadonly()) {
            // TODO add read-only support
            return false
        }

        try {
            let cfg = JSON.parse(file.content)
            // TODO validate?
            return true;
        } catch (e) {
            return false;
        }
    }

    loadFile(file: pkg.File) {
        this.config = JSON.parse(file.content)
        this.setDiagnostics(file, this.snapshotState())
    }

    menu() {
        return (<sui.Item text={lf("Back to Code") } icon={this.parent.state.header.editor == pxt.BLOCKS_PROJECT_NAME ? "puzzle" : "align left"} onClick={() => this.parent.setFile(pkg.mainEditorPkg().getMainFile()) } />)
    }
}
