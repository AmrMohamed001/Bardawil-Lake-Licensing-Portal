module.exports = class ApiFeatures {
    constructor(queryString, query) {
        this.queryString = queryString; // from express
        this.query = query // mongoose query
    }

    filter() {
        let queryCopy = { ...this.queryString };
        let exclude = ['sort', 'limit', 'page', 'fields'];
        exclude.forEach(ele => { delete queryCopy[ele] })

        // Build advanced filter
        let ops = {
            '>': '$gt',
            '>=': '$gte',
            '<': '$lt',
            '<=': '$lte'
        };
        let advQueryObj = {};

        Object.keys(queryCopy).forEach(key => {
            const match = key.match(/(.+)(>=|>|<=|<)$/);
            if (match) {
                const field = match[1];
                const op = ops[match[2]];
                if (!advQueryObj[field]) advQueryObj[field] = {};
                advQueryObj[field][op] = queryCopy[key];
            } else advQueryObj[key] = queryCopy[key];
        });
        this.query = this.query.find(advQueryObj);
        return this;
    }
    sort() {
        if (this.queryString.sort) {
            let sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }
        return this;
    }
    select() {
        if (this.queryString.fields) {
            let fieldsBy = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fieldsBy)
        } else {
            this.query = this.query.select('-__v')
        }
        return this;
    }
    paging(noDocs) {
        const limit = this.queryString.limit * 1 || 10;
        const page = this.queryString.page * 1 || 1;
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit);
        if (this.queryString.page)
            if (noDocs <= skip) throw new Error('this page is not exist');
        return this;
    }
    search(searchFields = ['title', 'description']) {
        if (this.queryString.search) {
            const searchQuery = searchFields.map(field => ({
                [field]: { $regex: this.queryString.search, $options: 'i' }
            }));

            this.query = this.query.find({ $or: searchQuery });
        }
        return this;
    }
}