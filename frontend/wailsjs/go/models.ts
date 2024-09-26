export namespace cpu {
	
	export class InfoStat {
	    cpu: number;
	    vendorId: string;
	    family: string;
	    model: string;
	    stepping: number;
	    physicalId: string;
	    coreId: string;
	    cores: number;
	    modelName: string;
	    mhz: number;
	    cacheSize: number;
	    flags: string[];
	    microcode: string;
	
	    static createFrom(source: any = {}) {
	        return new InfoStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpu = source["cpu"];
	        this.vendorId = source["vendorId"];
	        this.family = source["family"];
	        this.model = source["model"];
	        this.stepping = source["stepping"];
	        this.physicalId = source["physicalId"];
	        this.coreId = source["coreId"];
	        this.cores = source["cores"];
	        this.modelName = source["modelName"];
	        this.mhz = source["mhz"];
	        this.cacheSize = source["cacheSize"];
	        this.flags = source["flags"];
	        this.microcode = source["microcode"];
	    }
	}

}

export namespace filesystem {
	
	export class DirPathResult {
	    error?: string;
	    data: string;
	
	    static createFrom(source: any = {}) {
	        return new DirPathResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = source["error"];
	        this.data = source["data"];
	    }
	}
	export class SaveFilePayload {
	    fullPath: string;
	    data: string;
	
	    static createFrom(source: any = {}) {
	        return new SaveFilePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fullPath = source["fullPath"];
	        this.data = source["data"];
	    }
	}

}

export namespace httpmanage {
	
	export class DownloadPayload {
	    url: string;
	    dirPath: string;
	    concurrent: number;
	
	    static createFrom(source: any = {}) {
	        return new DownloadPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.dirPath = source["dirPath"];
	        this.concurrent = source["concurrent"];
	    }
	}

}

export namespace utils {
	
	export class CpuInfo {
	    info: cpu.InfoStat[];
	    err: string;
	
	    static createFrom(source: any = {}) {
	        return new CpuInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.info = this.convertValues(source["info"], cpu.InfoStat);
	        this.err = source["err"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

