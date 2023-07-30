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

}

