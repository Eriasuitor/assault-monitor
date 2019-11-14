import React from 'react';
import logo from './logo.svg';
import { Menu, Icon, Col, Row, Statistic, Popconfirm, Collapse, message, Drawer, Form, Button, Input, Switch, DatePicker } from 'antd';
import { } from 'antd';
import './App.css';
import config from './config'
import moment from 'moment';

const { Panel } = Collapse;

const customPanelStyle = {
  borderRadius: 4,
  border: 0,
  overflow: 'hidden',
};

function StatusModel() {
  return <span className="status-model"><Icon type="disconnect" style={{ paddingRight: '8px' }} />信息提供端失联</span>
}

class App extends React.Component {

  state = {
    intelligenceObjects: {
      map: [],
      boolean: [],
      item: []
    },
    inputDrawer: {
      show: false,
      submitting: false,
      title: null,
      formItems: [
        // {
        //   title: '你好',
        //   key: 'hello',
        //   value: 'shame on you',
        //   type: 'string'
        // }
      ],
      callback: {
        url: null,
        method: 'POST',
      }
    }
  }

  config = {
    color: {
      warning: 'red',
      error: 'red',
      info: 'black',
      success: '#52c41a'
    }
  }

  componentDidMount() {
    this.syncIntelligences()
    setInterval(this.syncIntelligences.bind(this), 10000)
  }

  async syncIntelligences() {
    const intelligences = await fetch(config.sentryUrl, {
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json())
    const intelligenceObjects = {
      map: [],
      boolean: [],
      item: []
    }
    intelligences.forEach(intelligence => intelligenceObjects[intelligence.type].push(intelligence))
    this.setState({ intelligenceObjects })
  }

  buttonMeta(button, props = {}) {
    return button.callback && button.callback.noQuestion ? <Popconfirm key={button.title} placement="topLeft" title={button.callback.confirmTitle} onConfirm={(event) => {
      event.stopPropagation()
      this.send({ url: button.callback.url, method: button.callback.method, body: button.callback.defaultParams })
    }} okText="是" cancelText="否">
      < Icon
        {...props}
        type={button.type}
        title={button.title}
      />
    </Popconfirm>
      : < Icon
        {...props}
        type={button.type}
        key={button.title}
        title={button.title}
        {...(button.callback ? {
          onClick:
            (event) => {
              event.stopPropagation()
              const inputDrawer = this.state.inputDrawer
              inputDrawer.title = button.title
              inputDrawer.callback = {
                url: button.callback.url,
                method: button.callback.method
              }
              inputDrawer.formItems = button.callback.params
              if (button.callback.defaultParams) {
                inputDrawer.formItems.forEach(formItem => {
                  formItem.value = button.callback.defaultParams[formItem.key]
                  return formItem
                })
              }
              inputDrawer.show = true
              this.setState({ inputDrawer })
            }
        } : {})}
      />
  }

  mapMeta(map, classNames = '') {
    return <Statistic
      className={classNames || 'statistic'}
      title={map.title}
      key={map.title}
      value={map.value}
      valueStyle={{ color: this.config.color[map.level] }}
      // prefix={<Icon type="arrow-up" />}
      suffix={map.suffix}
    />
  }

  map(intelligence) {
    return <Col key={intelligence.key} span={6}>
      {
        this.mapMeta(intelligence.data)
      }
      {moment(intelligence.expiredAt).isSameOrBefore() && <StatusModel />}
    </Col>
  }

  boolean(intelligences) {
    return <Col span={24}>
      <div className='statistic boolean'>
        {intelligences.map(intelligence =>
          <div key={intelligence.key}>
            <span>{intelligence.data.title}</span>
            {
              intelligence.data.success ?
                <span className='status' style={{ color: '#52c41a' }}><Icon className='icon' type="check-circle" theme="twoTone" twoToneColor="#52c41a" />{intelligence.data.desc.success}</span>
                : <span className='status' style={{ color: 'red' }}><Icon className='icon' type="exclamation-circle" theme="twoTone" twoToneColor="red" />{intelligence.data.desc.failed}</span>
            }
            {moment(intelligence.expiredAt).isSameOrBefore() && <StatusModel />}
          </div>
        )}
      </div>
    </Col>
  }

  item(intelligence) {
    return <Col key={intelligence.key} span={13}>
      <Collapse
        defaultActiveKey={['1']}
        accordion
        bordered={false}
        className='collapse'
      >
        <Panel
          extra={
            <span>
              {
                intelligence.data.buttons.map(button => this.buttonMeta(button, { className: 'icon cant-select' }))
              }
            </span>

          }
          header={
            <span>
              {
                intelligence.data.maps.map(map => this.mapMeta(map, 'cant-select collapse-statistic'))
              }
            </span>
          } key="1" showArrow={false} style={customPanelStyle}>
          {
            intelligence.data.items.map(item =>
              <p key={item.title}>
                <span className='ip'>{item.title}</span>
                {item.buttons.map(button =>
                  <label key={button.title} className="item" style={{ color: this.config.color[button.level] }}>
                    {
                      this.buttonMeta(button, button.level === 'info' ? { className: 'status-icon' } : { className: 'status-icon', theme: "twoTone", twoToneColor: this.config.color[button.level] })
                    }
                    {button.title}
                  </label>
                )}
              </p>
            )
          }
        </Panel>
      </Collapse>
      {moment(intelligence.expiredAt).isSameOrBefore() && <StatusModel />}
    </Col >
  }

  send({ url, method, body }) {
    console.log({ url, method, body })
    return fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json'
      }
    })
  }

  closeInputDrawer() {
    const inputDrawer = this.state.inputDrawer
    inputDrawer.show = false
    this.setState({ inputDrawer })
  }

  inputTypeSpecified = {
    string: <Input />,
    number: <Input type="number" />,
    boolean: <Switch />
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div className='app'>
        <Row className='row'>
          <Col span={14}>
            {
              this.state.intelligenceObjects.map.map(intelligence =>
                this[intelligence.type](intelligence)
              )
            }
          </Col>
          <Col span={10}>
            {
              this.boolean(this.state.intelligenceObjects.boolean)
            }
          </Col>
        </Row>
        <Row className='row'>
          {
            this.state.intelligenceObjects.item.map(intelligence =>
              this[intelligence.type](intelligence)
            )
          }
        </Row>
        <Drawer
          title={this.state.inputDrawer.title}
          width={520}
          onClose={this.closeInputDrawer.bind(this)}
          visible={this.state.inputDrawer.show}
        >
          <Form
            labelCol={{
              xs: { span: 24 },
              sm: { span: 4 }
            }}
            wrapperCol={{
              xs: { span: 24 },
              sm: { span: 20 }
            }}
            onSubmit={
              async (e) => {
                e.preventDefault();
                this.props.form.validateFieldsAndScroll(async (err, values) => {
                  if (!err) {
                    this.setState({ submitting: true })
                    try {
                      await this.send({
                        url: this.state.inputDrawer.callback.url,
                        method: this.state.inputDrawer.callback.method,
                        body: values
                      })
                      message.warning('回调服务成功')
                      this.closeInputDrawer()
                    } catch (error) {
                      message.warning('回调服务时出现错误')
                    } finally {
                      this.setState({ submitting: false })
                    }
                  }
                });
              }
            }
          >
            {
              this.state.inputDrawer.formItems.map(form =>
                <Form.Item label={form.title}>
                  {getFieldDecorator(form.key, {
                    initialValue: form.value
                  })(
                    <Input />,
                  )}
                </Form.Item>
              )
            }
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                borderTop: '1px solid #e9e9e9',
                padding: '10px 16px',
                background: '#fff',
                textAlign: 'right',
              }}
            >
              <Button onClick={this.closeInputDrawer.bind(this)} style={{ marginRight: 8 }}>
                取消
            </Button>
              <Button htmlType="submit" type="primary" loading={this.state.inputDrawer.submitting}>
                确认
            </Button>
            </div>
          </Form>
        </Drawer>
      </div>
    );
  }
}

export default Form.create()(App);
