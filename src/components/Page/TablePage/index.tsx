import { Button, Card, Col, Form, Modal, Row, Tooltip } from 'antd';
import React, { Component } from 'react';

import { Dispatch } from 'redux';
import { FormComponentProps } from 'antd/es/form';
import { WrappedFormUtils } from 'antd/es/form/Form';
import { SorterResult } from 'antd/es/table';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';

import StandardTable, { StandardTableColumnProps, TableListItem } from '@/components/StandardTable';
import { TableListData, TableListParams, TableListPagination } from './index.d';

import styles from './index.less';

const getValue = (obj: { [x: string]: string[] }) =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

interface TablePageProps extends FormComponentProps {
  dispatch: Dispatch<any>;
  loading: boolean;
  // action of searching page list
  action: string;
  columns: StandardTableColumnProps<any>[];
  data: TableListData<any>;
  selectedRows?: TableListItem[];
  searchFormValues?: any;
  pageHeader?: boolean;
  title?: string;
  tableOptions?: any;
  handleSelectRows?: (rows: any[]) => void;
  onDelete?: (rows: any[]) => void;
  searchFormRender?: (form: WrappedFormUtils) => React.ReactNode;
  operatorRender?: () => React.ReactNode;
  expandedRowRender?: () => React.ReactNode;
}

interface TablePageState {
  selectedRows: TableListItem[];
  searchFormValues: any;
  pagination: Partial<TableListPagination>;
  filters?: any;
  sorter?: SorterResult<TableListItem>;
}

class TablePage extends Component<TablePageProps, TablePageState> {
  constructor(props: TablePageProps) {
    super(props);
    this.state = {
      selectedRows: props.selectedRows || [],
      searchFormValues: props.searchFormValues || {},
      pagination: {
        pageSize: 10,
        current: 1,
        ...props.data.pagination,
      },
    };
  }

  componentDidMount() {
    this.doSearch();
  }

  handleFormReset = () => {
    const { form } = this.props;
    form.resetFields();
    this.setState(
      {
        searchFormValues: {},
      },
      this.doSearch,
    );
  };

  handleStandardTableChange = (
    pagination: Partial<TableListPagination>,
    filtersArg: Record<keyof TableListItem, string[]>,
    sorter: SorterResult<TableListItem>,
  ) => {
    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});
    this.setState(
      {
        pagination: {
          current: pagination.current,
          pageSize: pagination.pageSize,
        },
        filters,
        sorter,
      },
      this.doSearch,
    );
  };

  /**
   * Callback after selecting/unselecting rows
   * @param rows
   */
  handleSelectRows = (rows: TableListItem[]) => {
    this.setState(
      {
        selectedRows: rows,
      },
      () => {
        const { handleSelectRows } = this.props;
        if (handleSelectRows) {
          handleSelectRows(rows);
        }
      },
    );
  };

  /**
   * Search Hanlder
   * @param e
   */
  handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const { form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;

      // TODO 添加格式化
      const values = {
        ...fieldsValue,
      };

      const { pagination } = this.state;

      this.setState(
        {
          searchFormValues: values,
          pagination: {
            ...pagination,
            current: 1,
          },
        },
        this.doSearch,
      );
    });
  };

  handleMenuClick = () => {
    const { selectedRows } = this.state;
    const { onDelete } = this.props;

    if (selectedRows.length === 0) return;
    Modal.confirm({
      title: formatMessage(
        { id: 'component.common.text.delete-items' },
        { count: selectedRows.length },
      ),
      okType: 'danger',
      onOk() {
        if (onDelete) {
          onDelete(selectedRows);
        }
      },
      onCancel() {},
    });
  };

  doSearch = () => {
    const { action, dispatch } = this.props;
    const { searchFormValues, pagination, filters, sorter } = this.state;
    const params: Partial<TableListParams> = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...searchFormValues,
      ...filters,
    };
    if (sorter && sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    dispatch({
      type: action,
      payload: params,
    });
  };

  /**
   * Search form render
   */
  renderSearchForm() {
    const { searchFormRender, form } = this.props;

    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          {searchFormRender && searchFormRender(form)}
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                <FormattedMessage id="component.tablePage.text.search" />
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                <FormattedMessage id="component.tablePage.text.reset" />
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }

  renderSearchPanel() {
    const { searchFormRender } = this.props;
    return (
      searchFormRender && <div className={styles.tableListForm}>{this.renderSearchForm()}</div>
    );
  }

  renderOperatorPanel() {
    const { operatorRender } = this.props;
    const { selectedRows } = this.state;
    return (
      operatorRender && (
        <div className={styles.tableListOperator}>
          <div>
            {operatorRender()}
            {selectedRows.length > 0 && (
              <Button onClick={this.handleMenuClick}>
                <FormattedMessage id="component.common.text.delete" />
              </Button>
            )}
          </div>
          <div className={styles.tableListOperatorRight}>
            <Tooltip title={formatMessage({ id: 'app.common.label.refresh' })}>
              <Button shape="circle" icon="sync" onClick={this.doSearch} />
            </Tooltip>
            <Tooltip title="显隐">
              <Button shape="circle" icon="appstore" />
            </Tooltip>
          </div>
        </div>
      )
    );
  }

  renderTableList() {
    const { loading, data, columns, expandedRowRender, tableOptions } = this.props;
    const { selectedRows } = this.state;
    return (
      <StandardTable
        selectedRows={selectedRows}
        loading={loading}
        data={data}
        columns={columns}
        expandedRowRender={expandedRowRender}
        onSelectRow={this.handleSelectRows}
        onChange={this.handleStandardTableChange}
        {...tableOptions}
      />
    );
  }

  renderPage() {
    return (
      <Card bordered={false}>
        <div className={styles.tableList}>
          {this.renderSearchPanel()}
          {this.renderOperatorPanel()}
          {this.renderTableList()}
        </div>
      </Card>
    );
  }

  render() {
    const { title, pageHeader } = this.props;

    if (pageHeader) {
      return <PageHeaderWrapper title={title}>{this.renderPage()}</PageHeaderWrapper>;
    }
    return this.renderPage();
  }
}

export default Form.create<TablePageProps>()(TablePage);
