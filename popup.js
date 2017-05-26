const { createElement, Component} = React;
const { render } = ReactDOM;

class Color extends tinycolor {
    constructor(string) {
        super(string);
        const hsl = this.toHsl();
        this.h = hsl.h;
        this.s = hsl.s;
        this.l = hsl.l;
    }
}

function createColor(string) {
    return new Color(string);
}

class ColorGroup {
    constructor() {
        this.colors = [];
        this.average = { h: 0, s: 0, l: 0 };
    }

    add(color) {
        if (!(color instanceof Color)) {
            color = new Color(color);
        }

        const darkerColor = this.colors.find(c => (c._a * 100) + (c.l * 10) + (c.s * -1) < (color._a * 100) + (color.l * 10) + (color.s * -1));
        if (darkerColor) {
            this.colors.splice(this.colors.indexOf(darkerColor) - 1, 0, color);
        } else {
            this.colors.push(color);
        }

        this.updateAverage();
        return this;
    }

    updateAverage() {
        const h = this.colors.reduce((sum, c) => sum + c.h, 0) / this.colors.length;
        const s = this.colors.reduce((sum, c) => sum + c.s, 0) / this.colors.length;
        const l = this.colors.reduce((sum, c) => sum + c.l, 0) / this.colors.length;

        this.average = { h, s, l };
        return this;
    }

    shouldAddColor(variance, color) {
        const h = Math.abs(this.average.h - color.h);
        const s = Math.abs(this.average.s - color.s);
        const l = Math.abs(this.average.l - color.l);

        return h < variance.h && s < variance.s && l < variance.l;
    }
}

function groupColors(colors, variance) {
    return colors.reduce((colorGroups, color) => {
        const matchedGroup = colorGroups
            .find(g => g.shouldAddColor(variance, color));

        if (matchedGroup) {
            matchedGroup.add(color);
        } else {
            colorGroups.push(new ColorGroup().add(color));
        }

        return colorGroups.sort((aGroup, bGroup) => aGroup.average.h > bGroup.average.h);
    }, []);
}

class Output extends Component {
    render() {
        return (
            createElement(
                'div',
                null,
                groupColors(this.props.colors, this.props.variance)
                    .map(group => createElement(
                        'ul',
                        null,
                        group.colors.map(color => createElement(
                            'li',
                            { style: { backgroundColor: color } },
                            color._a !== 1 ? color.toRgbString() : color.toHexString()
                        ))
                    ))
            )
        );
    }
}

class Colors extends Component {
    constructor(props) {
        super(props);

        this.state = {
            variance: { h: 10, s: 0.4, l: 0.6 },
            colors: [],
        };
    }

    componentDidMount() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { message: 'getColors' }, (response) => {
                if (response && response.colors) {
                    console.log(response);
                    this.setState({ colors: response.colors.map(createColor) })
                }
            });
        });
    }

    render() {
        return (
            createElement(
                'div',
                null,
                createElement(
                    'div',
                    { className: 'control' },
                    createElement(
                        'label',
                        { htmlFor: 'hControl' },
                        'Hue'
                    ),
                    createElement(
                        'input',
                        {
                            id: 'hControl',
                            type: 'range',
                            min: 0,
                            max: 255,
                            value: this.state.variance.h,
                            onInput: e => {
                                const variance = Object.assign({}, this.state.variance, { h: e.target.value });
                                this.setState({ variance });
                            }
                        }
                    ),
                    createElement(
                        'label',
                        { htmlFor: 'sControl' },
                        'Saturation'
                    ),
                    createElement(
                        'input',
                        {
                            id: 'sControl',
                            type: 'range',
                            min: 0,
                            max: 1,
                            step: 0.01,
                            value: this.state.variance.s,
                            onInput: e => {
                                const variance = Object.assign({}, this.state.variance, { s: e.target.value });
                                this.setState({ variance });
                            }
                        }
                    ),
                    createElement(
                        'label',
                        { htmlFor: 'lControl' },
                        'Lightness'
                    ),
                    createElement(
                        'input',
                        {
                            id: 'lControl',
                            type: 'range',
                            min: 0,
                            max: 1,
                            step: 0.01,
                            value: this.state.variance.l,
                            onInput: e => {
                                const variance = Object.assign({}, this.state.variance, { l: e.target.value });
                                this.setState({ variance });
                            }
                        }
                    )
                ),
                createElement(
                    Output,
                    { colors: this.state.colors, variance: this.state.variance }
                )
            )
        );
    }
}

render(
    createElement(Colors),
    document.getElementById('App')
);
