function makeGaEvent(act, cat, lbl) {
    return ((req, res, next) => {
        req.visitor.event({
            ea: act,
            ec: cat,
            el: lbl
        }, e => {
        })
        next()
    })
}

exports.makeGaEvent = makeGaEvent