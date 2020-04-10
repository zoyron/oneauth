function makeGaEvent(act, cat, lbl) {
    return ((req, res, next) => {
        req.visitor.event({
            ea: act,
            ec: cat,
            el: lbl
        }).send()
        next()
    })
}

exports.makeGaEvent = makeGaEvent