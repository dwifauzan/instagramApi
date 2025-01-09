import { useState } from 'react'
import { Cascader } from 'antd'

interface Option {
    label: string
    value: string
    children?: Option[]
}

function CasCader(props: any) {
    const { data, defaultValue, trigger, onChange, isShowSearch, placeholder } =
        props

    const options = data
    const [state, setState] = useState({
        options,
    })

    const onChangeEvent = (value: any) => {
        onChange(value)
    }

    const onChangeLoading = (value: any, selectedOptions: Option[]) => {
        onChange(value, selectedOptions)
    }

    const filter = (inputValue: string, path: Option[]) => {
        return path.some(
            (option: any) =>
                option.label.toLowerCase().indexOf(inputValue.toLowerCase()) >
                -1
        )
    }

    const loadData = (selectedOptions: Option[]) => {
        const targetOption = selectedOptions[selectedOptions.length - 1]
        // load options lazily
    }

    return (
        <Cascader
            options={options}
            expandTrigger={trigger}
            defaultValue={defaultValue}
            showSearch={isShowSearch && { filter }}
            loadData={loadData}
            placeholder={placeholder ? placeholder : 'Please Select'}
        />
    )
}

export { CasCader }
